const OpenAI = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate a local fallback evaluation in case OpenAI is unavailable
 */
function generateLocalEvaluation(question, responseText, category, difficulty) {
  const wordCount = responseText ? responseText.split(/\s+/).length : 0;
  
  // Base score on response length and simple heuristics
  let score = 5.0;
  if (wordCount > 150) score += 2.0;
  else if (wordCount > 70) score += 1.0;
  else if (wordCount < 20) score -= 2.0;
  
  // Clamp score
  score = Math.min(10.0, Math.max(1.0, score));
  
  let strengths = [];
  let improvements = [];
  let summary = "";
  
  const isBehavioral = category?.toLowerCase().includes("behavioral") || question?.toLowerCase().includes("tell me about");
  
  if (isBehavioral) {
    strengths = [
      "Structured narrative delivery",
      "Good expression of personal contribution"
    ];
    improvements = [
      "Could make situation metrics more specific",
      "Structure the resolution using the STAR method"
    ];
    summary = "A good attempt at a behavioral question. Make sure to structure your answers around the STAR method: Situation, Task, Action, and Result. Providing quantifiable outcomes will make your answer stronger.";
  } else {
    strengths = [
      "Covers fundamental concepts",
      "Clear attempt at explaining trade-offs"
    ];
    improvements = [
      "Explicitly state time and space complexity",
      "Discuss edge cases in depth"
    ];
    summary = "Solid high-level overview. For technical coding questions, it's critical to state the time and space complexity (Big-O notation) of your proposed solution first, and walk through edge cases explicitly.";
  }
  
  return {
    score: parseFloat(score.toFixed(1)),
    strengths,
    improvements,
    summary
  };
}

/**
 * Evaluates candidate response using OpenAI or falls back locally
 */
async function evaluateResponse(question, responseText, category = "General", difficulty = "Medium") {
  if (!openai) {
    console.log("⚠️ OpenAI service not initialized. Using local evaluation fallback.");
    return generateLocalEvaluation(question, responseText, category, difficulty);
  }
  
  try {
    const prompt = `You are a premium AI Interview Trainer. Analyze the candidate's answer to the following question.
Question Category: ${category}
Question Difficulty: ${difficulty}
Question: "${question}"
Candidate's Response: "${responseText}"

Evaluate the response objectively. Provide the feedback ONLY as a valid JSON object in this exact schema:
{
  "score": 7.5, // Float between 1.0 and 10.0
  "strengths": ["string", "string"], // 2 to 3 key strengths of the answer
  "improvements": ["string", "string"], // 2 to 3 actionable areas to improve
  "summary": "string" // A concise 2-3 sentence summary feedback for the candidate
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant specialized in conducting interview assessments. You analyze interview text responses and provide constructive feedback in structured JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = completion.choices[0].message.content;
    const evaluation = JSON.parse(content);
    
    // Validate fields
    if (typeof evaluation.score !== 'number' || !Array.isArray(evaluation.strengths) || !Array.isArray(evaluation.improvements) || typeof evaluation.summary !== 'string') {
      throw new Error("Invalid output format from OpenAI API response");
    }
    
    // Normalize score
    evaluation.score = parseFloat(Math.min(10.0, Math.max(1.0, evaluation.score)).toFixed(1));
    return evaluation;

  } catch (error) {
    console.error("❌ OpenAI assessment failed, using local evaluation:", error.message);
    return generateLocalEvaluation(question, responseText, category, difficulty);
  }
}

/**
 * Fallback questions lists
 */
const FALLBACK_HR_QUESTIONS = [
  {
    id: "hr_fallback_1",
    category: "Behavioral",
    difficulty: "Medium",
    title: "Tell me about a challenging project you worked on",
    description: "Describe a project that presented significant challenges and how you overcame them. Focus on your problem-solving approach, the obstacles you faced, and the final outcome.",
    keyPoints: [
      "Describe the project context and your role",
      "Explain the specific challenges you encountered", 
      "Detail your approach to solving these challenges",
      "Share the outcome and what you learned",
      "Reflect on how this experience has shaped your approach to future projects"
    ],
    tips: [
      "Use the STAR method (Situation, Task, Action, Result)",
      "Be specific about your contributions",
      "Focus on your problem-solving process",
      "Mention measurable outcomes when possible",
      "Show growth and learning from the experience"
    ],
    timeLimit: "3-5 minutes recommended"
  },
  {
    id: "hr_fallback_2",
    category: "Behavioral",
    difficulty: "Medium",
    title: "Describe a time you had to deal with a conflict in a team",
    description: "Explain a situation where you had a disagreement or conflict with a peer or teammate, and how you handled it.",
    keyPoints: [
      "State the context and what caused the conflict",
      "Explain your strategy for resolving it objectively",
      "Detail the resulting compromise or agreement",
      "Reflect on what you learned from this experience"
    ],
    tips: [
      "Do not criticize or speak negatively of colleagues",
      "Emphasize communication and compromise",
      "Focus on alignment towards team goals"
    ],
    timeLimit: "3-5 minutes recommended"
  },
  {
    id: "hr_fallback_3",
    category: "Behavioral",
    difficulty: "Hard",
    title: "Tell me about a time you failed and how you handled it",
    description: "Describe a specific instance where your performance fell short of expectations, or a task did not succeed. Detail how you reacted, resolved the situation, and grew from it.",
    keyPoints: [
      "Set the scene and own the failure",
      "Detail the immediate actions taken to mitigate the failure",
      "Explain the key learnings and how you applied them later"
    ],
    tips: [
      "Choose a genuine mistake, not a disguised strength",
      "Take responsibility; avoid blaming others",
      "Emphasize growth and positive actions since then"
    ],
    timeLimit: "3-5 minutes recommended"
  }
];

const FALLBACK_TECH_QUESTIONS = [
  {
    id: "tech_fallback_1",
    category: "Technical (Data Structures)",
    difficulty: "Medium",
    title: "Implement a function to find the lowest common ancestor in a Binary Tree",
    description: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree. Explain the time and space complexity of your approach.",
    keyPoints: [
      "Traverse the tree recursively or iteratively",
      "Identify the base cases (null, matching nodes)",
      "Combine left and right search results"
    ],
    tips: [
      "Clarify if it is a Binary Search Tree (BST) or standard Binary Tree",
      "State the space complexity of the call stack recursion"
    ],
    timeLimit: "10-15 minutes recommended"
  },
  {
    id: "tech_fallback_2",
    category: "Technical (System Design)",
    difficulty: "Hard",
    title: "Design a distributed rate limiter",
    description: "How would you design a distributed rate limiter for a high-traffic web API? Explain the algorithm (Token Bucket, Sliding Window Log) and storage replication choices.",
    keyPoints: [
      "Outline the rate limiter algorithm and choices",
      "Explain how to handle concurrency and replication (e.g. using Redis)",
      "Detail rate limiter placement (API gateway, middleware)"
    ],
    tips: [
      "Discuss network latency overhead of calling Redis",
      "Cover how to handle rate-limiting edge cases"
    ],
    timeLimit: "15-20 minutes recommended"
  },
  {
    id: "tech_fallback_3",
    category: "Technical (Web Development)",
    difficulty: "Medium",
    title: "Explain the virtual DOM and reconciliation process in React",
    description: "Explain how React uses a Virtual DOM to optimize DOM updates, and how the Diffing algorithm and Reconciliation works.",
    keyPoints: [
      "Describe the render phase vs commit phase",
      "Explain element diffing keys and types",
      "State how state updates queue rendering"
    ],
    tips: [
      "Discuss why React keys are critical for performance",
      "Distinguish between React 18 concurrent features and legacy rendering"
    ],
    timeLimit: "5-10 minutes recommended"
  }
];

/**
 * Generates a random HR question using OpenAI
 */
async function generateHRQuestion() {
  if (!openai) {
    const idx = Math.floor(Math.random() * FALLBACK_HR_QUESTIONS.length);
    return FALLBACK_HR_QUESTIONS[idx];
  }

  try {
    const prompt = `Generate a high-quality HR or behavioral interview question. It should assess soft skills, leadership, conflict resolution, teamwork, or growth mindset.
Provide the question ONLY as a valid JSON object matching this exact schema:
{
  "id": "string", // Random generated ID e.g. "hr_random_xyz"
  "category": "Behavioral",
  "difficulty": "Easy" | "Medium" | "Hard",
  "title": "Question text here",
  "description": "Elaborate description of what the candidate should discuss",
  "keyPoints": ["string", "string", ...], // 3-4 key points they should cover
  "tips": ["string", "string", ...], // 3-4 tips for answering
  "timeLimit": "3-5 minutes recommended"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant specialized in generating interview assessments. You output valid JSON objects matching the schema provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 400
    });

    const question = JSON.parse(completion.choices[0].message.content);
    return question;
  } catch (error) {
    console.error("❌ OpenAI HR question generation failed, using fallback:", error.message);
    const idx = Math.floor(Math.random() * FALLBACK_HR_QUESTIONS.length);
    return FALLBACK_HR_QUESTIONS[idx];
  }
}

/**
 * Generates 3 customized technical questions using OpenAI based on resume/JD text
 */
async function generateTechnicalQuestions(documentText) {
  if (!openai) {
    return FALLBACK_TECH_QUESTIONS;
  }

  try {
    const prompt = `You are a technical interviewer. Analyze the following candidate document (Resume or Job Description) and generate exactly 3 custom technical interview questions that assess relevant skills (algorithms, coding, system design, framework-specific knowledge, or core engineering concepts).
Candidate Document Content:
"${documentText.substring(0, 4000)}"

Provide the response ONLY as a valid JSON array of objects, containing exactly 3 objects. Schema for each object:
{
  "id": "string", // e.g. "tech_cust_1"
  "category": "string", // e.g. "Technical (System Design)"
  "difficulty": "Easy" | "Medium" | "Hard",
  "title": "Question Title",
  "description": "Specific details, instructions, or inputs/outputs of the question",
  "keyPoints": ["string", "string", ...], // 3-4 key points to answer
  "tips": ["string", "string", ...], // 3-4 helpful tips
  "timeLimit": "string" // e.g., "15 minutes recommended"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant specialized in generating customized technical interview questions. You output valid JSON arrays matching the schema provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Check if questions are wrapped in an object key
    let questions = Array.isArray(result) ? result : result.questions || result.data || Object.values(result)[0];
    
    if (!Array.isArray(questions)) {
      throw new Error("JSON response did not parse as an array");
    }

    return questions.slice(0, 3);
  } catch (error) {
    console.error("❌ OpenAI Technical question generation failed, using fallback:", error.message);
    return FALLBACK_TECH_QUESTIONS;
  }
}

/**
 * AI review for coding solution submissions
 */
async function evaluateCodingSubmission(problem, code, language, executionResult) {
  if (!openai) {
    return {
      correctness: executionResult.passed ? "Looks Correct" : "Incorrect",
      codeQuality: "Pending Review",
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
      readability: "Medium",
      naming: "Standard",
      optimizationOpportunities: "Could not evaluate without API key.",
      interviewReadiness: "Needs Review",
      detailedReview: "Please add your API key to enable AI Code Review feedback."
    };
  }

  try {
    const prompt = `You are a Principal Software Engineer conducting a coding interview. Analyze the candidate's submission for the following problem.

Problem: ${problem.title}
Difficulty: ${problem.difficulty}
Category: ${problem.category}
Description: ${problem.description}

Candidate Submission:
Language: ${language}
Code:
${code}

Execution Result:
Passed Test Cases: ${executionResult.passedCount} / ${executionResult.totalCount}
Status: ${executionResult.status}
Stdout/Output: ${executionResult.output}

Provide structured feedback inside a valid JSON object matching this schema exactly:
{
  "correctness": "Brief summary of correctness",
  "codeQuality": "Review of quality, modularity, and comments",
  "timeComplexity": "Big O time complexity notation e.g. O(N)",
  "spaceComplexity": "Big O space complexity notation e.g. O(1)",
  "readability": "Readability evaluation (High/Medium/Low)",
  "naming": "Evaluation of variable and function naming conventions",
  "optimizationOpportunities": "Any structural or logic enhancements",
  "interviewReadiness": "Interview readiness feedback (e.g. 'Strong Keep', 'Hire', 'Borderline', 'Needs Practice')",
  "detailedReview": "Detailed constructive review paragraphs addressing pros and cons of the candidate's solution."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer reviewing coding solutions. Output valid JSON objects matching the schema provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 800
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("❌ OpenAI code review failed, using fallback:", error.message);
    return {
      correctness: executionResult.passed ? "Looks Correct" : "Incorrect",
      codeQuality: "Fallback Heuristics",
      timeComplexity: "O(N) Estimated",
      spaceComplexity: "O(1) Estimated",
      readability: "Medium",
      naming: "Standard",
      optimizationOpportunities: "Optimizations check failed due to API limitations.",
      interviewReadiness: "Borderline",
      detailedReview: "Heuristic fallback feedback: Ensure you trace edge cases and verify time constraints manually."
    };
  }
}

/**
 * AI Problem generator to spawn interview coding problems
 */
async function generateAICodingProblem(role, company, topic, difficulty) {
  if (!openai) {
    throw new Error("OpenAI API key is missing. AI coding problem generation requires a valid API key.");
  }

  try {
    const prompt = `Generate a high-quality, professional technical interview coding problem based on the following context:
Role: ${role}
Company: ${company}
Topic/Topic Area: ${topic}
Difficulty: ${difficulty}

Output ONLY as a valid JSON object matching this schema:
{
  "title": "Problem Title",
  "difficulty": "Easy" | "Medium" | "Hard",
  "category": "Topic Name",
  "acceptance": "e.g. 50.0%",
  "description": "HTML description of the coding challenge, including problem details. Use <code>, <pre>, <strong>, and <em> for clean rendering.",
  "examples": [
    {
      "input": "String input notation",
      "output": "Expected output notation",
      "explanation": "Optional short explanation of Example"
    }
  ],
  "constraints": ["Constraint 1", "Constraint 2"],
  "followUp": "Optional follow-up question or optimization prompt",
  "starterCode": {
    "javascript": "Starter code function structure",
    "python": "Starter code structure",
    "java": "Starter code structure",
    "cpp": "Starter code structure",
    "c": "Starter code structure"
  },
  "testCases": [
    { "input": "input representation string (e.g. '[2,7,11,15], 9')", "expected": "expected output string (e.g. '[0,1]')" },
    { "input": "input representation string", "expected": "expected output string" },
    { "input": "input representation string", "expected": "expected output string" }
  ],
  "testRunners": {
    "javascript": "__USER_CODE__\\nconsole.log(JSON.stringify(FUNCTION_NAME(INPUT)));",
    "python": "__USER_CODE__\\nimport json\\nprint(json.dumps(FUNCTION_NAME(INPUT)))",
    "cpp": "Complete cpp runner text embedding __USER_CODE__ and parsing/running case...",
    "java": "Complete java runner text embedding __USER_CODE__ ...",
    "c": "Complete c runner text embedding __USER_CODE__ ..."
  }
}

IMPORTANT Instructions:
- Choose the function name carefully and ensure it is consistent across starterCode, testCases, and testRunners.
- Replace FUNCTION_NAME with the actual function (e.g. twoSum) and INPUT with the test case arguments.
- In cpp, java, and c runners, write the complete scaffolding class or Main class. Make sure that __USER_CODE__ is injected properly and the test cases parse. Use standard placeholder replacements if needed (e.g. replace __TEST_INPUT__ with test case values).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI specialized in generating professional programming interview problems. Output valid JSON objects only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const problem = JSON.parse(completion.choices[0].message.content);
    
    // Add additional meta
    problem.isAI = true;
    problem.role = [role];
    problem.company = [company];
    
    return problem;
  } catch (error) {
    console.error("❌ OpenAI coding question generation failed:", error.message);
    throw error;
  }
}

module.exports = { evaluateResponse, generateHRQuestion, generateTechnicalQuestions, evaluateCodingSubmission, generateAICodingProblem };
