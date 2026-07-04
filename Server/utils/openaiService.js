const OpenAI = require('openai');

let openai = null;
const isGeminiKey = (key) => key && (key.startsWith("AQ.") || key.startsWith("AIzaSy"));

if (process.env.OPENAI_API_KEY && !isGeminiKey(process.env.OPENAI_API_KEY)) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (err) {
    console.error("⚠️ Failed to initialize OpenAI client in openaiService:", err.message);
  }
}

/**
 * Call Gemini API directly via fetch
 */
async function callGemini(prompt, responseJson = true) {
  const apiKey = process.env.GEMINI_API_KEY || (isGeminiKey(process.env.OPENAI_API_KEY) ? process.env.OPENAI_API_KEY : null);
  if (!apiKey) {
    throw new Error("No Gemini API key available");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  if (responseJson) {
    payload.generationConfig = {
      responseMimeType: "application/json"
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API returned ${response.status}: ${errText}`);
  }

  const result = await response.json();
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
    throw new Error("Invalid response format from Gemini API");
  }

  return result.candidates[0].content.parts[0].text;
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
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY || isGeminiKey(process.env.OPENAI_API_KEY));
  
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

  if (hasGeminiKey) {
    try {
      console.log("🚀 Generating evaluation using Google Gemini API...");
      const content = await callGemini(prompt, true);
      const evaluation = JSON.parse(content);
      evaluation.score = parseFloat(Math.min(10.0, Math.max(1.0, evaluation.score)).toFixed(1));
      return evaluation;
    } catch (geminiError) {
      console.error("❌ Gemini evaluation failed:", geminiError.message);
    }
  }

  if (openai) {
    try {
      console.log("🚀 Generating evaluation using OpenAI API...");
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
      evaluation.score = parseFloat(Math.min(10.0, Math.max(1.0, evaluation.score)).toFixed(1));
      return evaluation;
    } catch (error) {
      console.error("❌ OpenAI assessment failed:", error.message);
    }
  }

  console.log("⚠️ Both API engines failed or are missing credentials. Using local evaluation fallback.");
  return generateLocalEvaluation(question, responseText, category, difficulty);
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
 * Generates a random HR question using OpenAI or Gemini
 */
async function generateHRQuestion() {
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY || isGeminiKey(process.env.OPENAI_API_KEY));
  
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

  if (hasGeminiKey) {
    try {
      console.log("🚀 Generating random HR question using Google Gemini API...");
      const content = await callGemini(prompt, true);
      return JSON.parse(content);
    } catch (err) {
      console.error("❌ Gemini HR question generation failed:", err.message);
    }
  }

  if (openai) {
    try {
      console.log("🚀 Generating random HR question using OpenAI API...");
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
    }
  }

  const idx = Math.floor(Math.random() * FALLBACK_HR_QUESTIONS.length);
  return FALLBACK_HR_QUESTIONS[idx];
}

/**
 * Generates 3 customized technical questions using OpenAI or Gemini based on resume/JD text
 */
async function generateTechnicalQuestions(documentText) {
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY || isGeminiKey(process.env.OPENAI_API_KEY));
  
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

  if (hasGeminiKey) {
    try {
      console.log("🚀 Generating technical questions using Google Gemini API...");
      const content = await callGemini(prompt, true);
      const result = JSON.parse(content);
      let questions = Array.isArray(result) ? result : result.questions || result.data || Object.values(result)[0];
      if (Array.isArray(questions)) {
        return questions.slice(0, 3);
      }
    } catch (err) {
      console.error("❌ Gemini technical question generation failed:", err.message);
    }
  }

  if (openai) {
    try {
      console.log("🚀 Generating technical questions using OpenAI API...");
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
      
      if (Array.isArray(questions)) {
        return questions.slice(0, 3);
      }
    } catch (error) {
      console.error("❌ OpenAI Technical question generation failed, using fallback:", error.message);
    }
  }

  return FALLBACK_TECH_QUESTIONS;
}

/**
 * Convert raw resume text into structured JSON
 */
async function structureResume(resumeText) {

  const prompt = `
You are an expert resume parser.

Convert the following resume into a structured JSON object.

Return ONLY valid JSON.

Schema:

{
  "name": "",
  "email": "",
  "phone": "",
  "summary": "",

  "skills": [],

  "experience": [

    {
      "company": "",
      "designation": "",
      "duration": "",
      "description": []
    }

  ],

  "projects":[

    {
      "title":"",
      "technologies":[],
      "description":[]
    }

  ],

  "education":[

    {
      "institution":"",
      "degree":"",
      "duration":"",
      "grade":""
    }

  ],

  "certifications":[]

}

Resume:

${resumeText}

`;

  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY ||
    isGeminiKey(process.env.OPENAI_API_KEY)
  );

  try {

    let content = null;

    // ---------- Try Gemini First ----------
    if (hasGeminiKey) {

      try {

        console.log("Using Gemini for Resume Structuring...");

        content = await callGemini(prompt, true);

      } catch (geminiError) {

        console.error("Gemini Failed:", geminiError.message);

      }

    }

    // ---------- Fallback to OpenAI ----------
    if (!content && openai) {

      try {

        console.log("Using OpenAI for Resume Structuring...");

        const completion = await openai.chat.completions.create({

          model: "gpt-4o-mini",

          messages: [

            {
              role: "system",
              content:
                "You are an expert resume parser. Return ONLY valid JSON."
            },

            {
              role: "user",
              content: prompt
            }

          ],

          response_format: {
            type: "json_object"
          },

          temperature: 0

        });

        content = completion.choices[0].message.content;

      } catch (openAIError) {

        console.error("OpenAI Failed:", openAIError.message);

      }

    }

    if (!content) {

      throw new Error(
        "Both Gemini and OpenAI are currently unavailable."
      );

    }

    return JSON.parse(content);

  } catch (err) {

    console.error("Resume Structuring Error:", err);

    throw err;

  }

}

/**
 * Extract structured requirements from a Job Description
 */
async function extractJobRequirements(jobDescription) {

  const prompt = `
You are an expert Technical Recruiter.

Analyze the following Job Description.

Return ONLY valid JSON.

Do not explain.

Schema:

{
  "role": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "minimumExperience": "",
  "education": "",
  "certifications": [],
  "responsibilities": []
}

Job Description:

${jobDescription}
`;

  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY ||
    isGeminiKey(process.env.OPENAI_API_KEY)
  );

  let content = null;

  // ---------- Gemini ----------
  if (hasGeminiKey) {

    try {

      console.log("Using Gemini for JD Parsing...");

      content = await callGemini(prompt, true);

    } catch (err) {

      console.error("Gemini JD Parser Failed:", err.message);

    }

  }

  // ---------- OpenAI ----------
  if (!content && openai) {

    try {

      console.log("Using OpenAI for JD Parsing...");

      const completion =
        await openai.chat.completions.create({

          model: "gpt-4o-mini",

          messages: [

            {
              role: "system",
              content:
                "Return ONLY JSON."
            },

            {
              role: "user",
              content: prompt
            }

          ],

          response_format: {
            type: "json_object"
          },

          temperature: 0

        });

      content =
        completion.choices[0].message.content;

    } catch (err) {

      console.error("OpenAI JD Parser Failed:", err.message);

    }

  }

  if (!content) {

    throw new Error(
      "Unable to parse Job Description."
    );

  }

  return JSON.parse(content);

}
module.exports = {

    evaluateResponse,

    generateHRQuestion,

    generateTechnicalQuestions,

    structureResume,

    extractJobRequirements

};
