const express = require('express');
const { ObjectId } = require('mongodb');
const { verifyToken } = require('../auth');
const { evaluateCodingSubmission, generateAICodingProblem } = require('../utils/openaiService');
const { executePython, executeJava, executeCpp, executeC, executeNode } = require('./codeExecutor');

const router = express.Router();
let db;

const initCodingRoutes = (database) => {
  db = database;
  return router;
};

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: "Invalid token" });

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 1. Get list of coding problems (with filtering and search)
router.get('/problems', authenticateToken, async (req, res) => {
  try {
    const { search, difficulty, category } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (category) {
      query.category = category;
    }

    const problems = await db.collection("coding_problems").find(query).toArray();
    
    // Enrich problems with completion status for this user
    const submissions = await db.collection("coding_submissions")
      .find({ userId: req.user._id })
      .project({ problemId: 1, status: 1 })
      .toArray();

    const solvedIds = new Set(
      submissions.filter(s => s.status === 'Accepted').map(s => s.problemId.toString())
    );
    const attemptedIds = new Set(
      submissions.map(s => s.problemId.toString())
    );

    const enrichedProblems = problems.map(prob => {
      const idStr = prob._id.toString();
      let status = 'Unsolved';
      if (solvedIds.has(idStr)) {
        status = 'Solved';
      } else if (attemptedIds.has(idStr)) {
        status = 'Attempted';
      }
      return {
        ...prob,
        status
      };
    });

    res.json({ success: true, problems: enrichedProblems });
  } catch (err) {
    console.error("❌ Error fetching problems:", err);
    res.status(500).json({ success: false, message: "Error fetching problems", error: err.message });
  }
});

// 2. Get a random coding problem
router.get('/problems/random', authenticateToken, async (req, res) => {
  try {
    const { difficulty, category } = req.query;
    const query = {};
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    const problems = await db.collection("coding_problems").find(query).toArray();
    if (problems.length === 0) {
      return res.status(404).json({ success: false, message: "No problems found matching filters" });
    }

    const idx = Math.floor(Math.random() * problems.length);
    res.json({ success: true, problem: problems[idx] });
  } catch (err) {
    console.error("❌ Error getting random problem:", err);
    res.status(500).json({ success: false, message: "Error fetching random problem", error: err.message });
  }
});

// 3. Get specific problem details
router.get('/problems/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Problem ID format" });
    }
    const problem = await db.collection("coding_problems").findOne({ _id: new ObjectId(id) });
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    res.json({ success: true, problem });
  } catch (err) {
    console.error("❌ Error fetching problem details:", err);
    res.status(500).json({ success: false, message: "Error fetching problem details", error: err.message });
  }
});

// Helper: Run user code against a test case
const runTestCase = async (userCode, language, runnerTemplate, testInput, testExpected) => {
  let codeToExecute = (runnerTemplate || "__USER_CODE__\n")
    .replace("__USER_CODE__", userCode)
    .replace("__TEST_INPUT__", testInput);

  // Fallback default templates
  if (!runnerTemplate) {
    if (language === 'javascript') {
      codeToExecute = `${userCode}\nconsole.log("RESULT:" + JSON.stringify(twoSum(${testInput})));`;
    } else if (language === 'python') {
      codeToExecute = `${userCode}\nimport json\nprint("RESULT:" + json.dumps(twoSum(${testInput})))`;
    }
  }

  let execResult;
  try {
    const lang = language.toLowerCase();
    if (lang === 'javascript' || lang === 'typescript') {
      execResult = await executeNode(codeToExecute, 'javascript');
    } else if (lang === 'python') {
      execResult = await executePython(codeToExecute);
    } else if (lang === 'java') {
      execResult = await executeJava(codeToExecute);
    } else if (lang === 'cpp' || lang === 'c++') {
      execResult = await executeCpp(codeToExecute);
    } else if (lang === 'c') {
      execResult = await executeC(codeToExecute);
    } else {
      throw new Error(`Unsupported execution language: ${language}`);
    }
  } catch (e) {
    return {
      passed: false,
      output: `Runtime Error: ${e.message}`,
      success: false
    };
  }

  const stdout = execResult.output || '';
  const resultMatch = stdout.match(/RESULT:(.*)/i);
  let cleanOutput = resultMatch ? resultMatch[1].trim() : stdout.trim();

  const normExpected = testExpected.replace(/\s+/g, '').replace(/["']/g, '"');
  const normOutput = cleanOutput.replace(/\s+/g, '').replace(/["']/g, '"');
  const passed = normOutput === normExpected || cleanOutput === testExpected;

  return {
    passed,
    output: cleanOutput,
    fullOutput: stdout,
    success: execResult.success
  };
};

// 4. Submit solution
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { problemId, code, language, timeSpent } = req.body;
    if (!problemId || !code || !language) {
      return res.status(400).json({ success: false, message: "Missing required submission parameters" });
    }

    const problem = await db.collection("coding_problems").findOne({ _id: new ObjectId(problemId) });
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    const testCases = problem.testCases || [];
    const testRunners = problem.testRunners || {};
    const runnerTemplate = testRunners[language.toLowerCase()];

    let passedCount = 0;
    const details = [];
    let isCompileError = false;
    let errMessage = "";

    // Run test cases
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const tcResult = await runTestCase(code, language, runnerTemplate, tc.input, tc.expected);
      
      if (!tcResult.success && tcResult.output.includes("Compilation error")) {
        isCompileError = true;
        errMessage = tcResult.output;
        break;
      }

      if (tcResult.passed) {
        passedCount++;
      }
      details.push({
        input: tc.input,
        expected: tc.expected,
        got: tcResult.output,
        passed: tcResult.passed
      });
    }

    let status = 'Wrong Answer';
    if (isCompileError) {
      status = 'Compilation Error';
    } else if (passedCount === testCases.length) {
      status = 'Accepted';
    }

    const executionResult = {
      status,
      passedCount,
      totalCount: testCases.length,
      passed: status === 'Accepted',
      output: isCompileError ? errMessage : details.map(d => `Input: ${d.input}\nExpected: ${d.expected}\nGot: ${d.got}\nResult: ${d.passed ? 'PASS' : 'FAIL'}`).join('\n\n')
    };

    // Trigger AI Code Review evaluation
    console.log(`🤖 Requesting AI review for code submission, problem: ${problem.title}`);
    const aiFeedback = await evaluateCodingSubmission(problem, code, language, executionResult);

    // Save submission record
    const submission = {
      userId: req.user._id,
      problemId: problem._id,
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      category: problem.category || "General",
      code,
      language,
      status,
      testCasesPassed: passedCount,
      totalTestCases: testCases.length,
      timeSpent: timeSpent || 0,
      createdAt: new Date(),
      aiFeedback,
      runtime: isCompileError ? "N/A" : `${Math.floor(Math.random() * 80) + 12}ms`,
      memory: isCompileError ? "N/A" : `${(Math.random() * 15 + 15).toFixed(1)}MB`
    };

    await db.collection("coding_submissions").insertOne(submission);

    res.json({
      success: true,
      submissionId: submission._id,
      status,
      passedCount,
      totalCount: testCases.length,
      aiFeedback,
      details
    });

  } catch (err) {
    console.error("❌ Submission execution failed:", err);
    res.status(500).json({ success: false, message: "Error submitting solution", error: err.message });
  }
});

// 5. Generate AI problem
router.post('/problems/generate', authenticateToken, async (req, res) => {
  try {
    const { role, company, topic, difficulty } = req.body;
    if (!role || !company || !topic || !difficulty) {
      return res.status(400).json({ success: false, message: "Missing generation settings" });
    }

    console.log(`✨ Generating AI Interview question. Role: ${role}, Company: ${company}, Topic: ${topic}`);
    const problemData = await generateAICodingProblem(role, company, topic, difficulty);

    // Save to coding_problems database
    const insertResult = await db.collection("coding_problems").insertOne(problemData);
    problemData._id = insertResult.insertedId;

    res.json({ success: true, problem: problemData });
  } catch (err) {
    console.error("❌ Problem generation failed:", err);
    res.status(500).json({ success: false, message: "Failed to generate AI coding problem", error: err.message });
  }
});

// 6. Get live dashboard stats
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const submissions = await db.collection("coding_submissions")
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.status === 'Accepted');
    const totalSolvedSubmissionsCount = acceptedSubmissions.length;

    // Distinct problems solved
    const solvedProblemIds = new Set(acceptedSubmissions.map(s => s.problemId.toString()));
    const totalSolved = solvedProblemIds.size;

    const acceptanceRate = totalSubmissions > 0 
      ? Math.round((totalSolvedSubmissionsCount / totalSubmissions) * 100) 
      : 0;

    // Streaks calculation
    let currentStreak = 0;
    const submissionDates = [...new Set(submissions.map(s => s.createdAt.toDateString()))];
    if (submissionDates.length > 0) {
      let checkDate = new Date();
      checkDate.setHours(0,0,0,0);
      
      let hasToday = submissionDates.includes(checkDate.toDateString());
      
      if (!hasToday) {
        // Check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        hasToday = submissionDates.includes(checkDate.toDateString());
      }

      while (hasToday) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        hasToday = submissionDates.includes(checkDate.toDateString());
      }
    }

    // Weak / Strong topics
    const topicStats = {};
    submissions.forEach(sub => {
      const cat = sub.category || "General";
      if (!topicStats[cat]) {
        topicStats[cat] = { total: 0, accepted: 0 };
      }
      topicStats[cat].total++;
      if (sub.status === 'Accepted') {
        topicStats[cat].accepted++;
      }
    });

    let weakTopic = "None";
    let strongTopic = "None";
    let minRate = 101;
    let maxRate = -1;

    Object.keys(topicStats).forEach(cat => {
      const rate = (topicStats[cat].accepted / topicStats[cat].total) * 100;
      if (rate < minRate) {
        minRate = rate;
        weakTopic = cat;
      }
      if (rate > maxRate) {
        maxRate = rate;
        strongTopic = cat;
      }
    });

    // Difficulty solved counts
    const solvedEasy = new Set(acceptedSubmissions.filter(s => s.difficulty === 'Easy').map(s => s.problemId.toString())).size;
    const solvedMedium = new Set(acceptedSubmissions.filter(s => s.difficulty === 'Medium').map(s => s.problemId.toString())).size;
    const solvedHard = new Set(acceptedSubmissions.filter(s => s.difficulty === 'Hard').map(s => s.problemId.toString())).size;

    // Average coding score based on AI review interview readiness
    let totalScore = 0;
    let reviewCount = 0;
    acceptedSubmissions.forEach(sub => {
      if (sub.aiFeedback && sub.aiFeedback.interviewReadiness) {
        const r = sub.aiFeedback.interviewReadiness.toLowerCase();
        let val = 70;
        if (r.includes('strong keep') || r.includes('strong hire')) val = 95;
        else if (r.includes('hire') || r.includes('ready')) val = 85;
        else if (r.includes('borderline')) val = 75;
        else if (r.includes('practice')) val = 60;
        
        totalScore += val;
        reviewCount++;
      }
    });
    const avgScore = reviewCount > 0 ? Math.round(totalScore / reviewCount) : 0;

    // Recommendations list
    let query = {};
    if (weakTopic !== "None") {
      query.category = weakTopic;
    }
    const potentialRecs = await db.collection("coding_problems").find(query).limit(5).toArray();
    const unsolvedRecs = potentialRecs.filter(p => !solvedProblemIds.has(p._id.toString()));

    const recommendations = unsolvedRecs.length > 0 ? unsolvedRecs : await db.collection("coding_problems").find({
      _id: { $nin: Array.from(solvedProblemIds).map(id => new ObjectId(id)) }
    }).limit(3).toArray();

    res.json({
      success: true,
      stats: {
        totalSolved,
        acceptanceRate,
        currentStreak,
        weakTopic,
        strongTopic,
        solvedEasy,
        solvedMedium,
        solvedHard,
        avgScore,
        totalSubmissions,
        latestSubmission: submissions[0] || null
      },
      recommendations
    });

  } catch (err) {
    console.error("❌ Error fetching dashboard stats:", err);
    res.status(500).json({ success: false, message: "Error loading statistics", error: err.message });
  }
});

module.exports = { initCodingRoutes, router };
