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

module.exports = { evaluateResponse };
