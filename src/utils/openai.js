import OpenAI from "openai";

// Warning: Using API keys in the browser is generally insecure. 
// This is for demonstration / prototype purposes per user request.
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

/**
 * Validates a new munition submission against existing ones to prevent duplicates.
 * Also formats it properly.
 * @param {string} type 'HOMEWORK' or 'EXAM_INTEL'
 * @param {string} subject 
 * @param {string} content 
 * @param {Array} existingItems 
 * @returns {Object} { isDuplicate: boolean, formattedContent: string, priority: string, dueDate: string }
 */
export const processMunition = async (type, subject, content, existingItems) => {
  const existingStr = existingItems.map(item => `- ${item.subject}: ${item.content}`).join('\n');
  
  const prompt = `
You are the IJP Central Intelligence AI.
A student is submitting new ${type === 'HOMEWORK' ? 'Homework Munition' : 'Exam Intel'}.
Subject: ${subject}
Content: ${content}

Here are the currently active ${type} items:
${existingStr || 'None.'}

Task 1: Determine if this is a duplicate or highly similar to an existing active item.
Task 2: If NOT a duplicate, format the content into a concise, bureaucratic, slightly threatening tone suitable for the IJP.
Task 3: Assign a priority (e.g. CRITICAL PRIORITY, NEUTRALIZED, LEVEL 2 SEVERITY, etc).
Task 4: Suggest a standardized due date / time frame string (e.g. '0800 HRS, TOMORROW', 'T-MINUS 48 HOURS').

Return ONLY a JSON object exactly like this, nothing else:
{
  "isDuplicate": true or false,
  "formattedContent": "string",
  "priority": "string",
  "dueDate": "string"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (err) {
    console.error("OpenAI Error:", err);
    throw new Error("Central Intelligence is currently offline.");
  }
};

/**
 * Generates a random 9th grade homework or exam intel item if none exist.
 */
export const generateRandomIntel = async (type) => {
  const prompt = `
You are the IJP Central Intelligence AI.
Generate a random, realistic 9th-grade ${type === 'HOMEWORK' ? 'homework assignment' : 'exam warning'} for either Math, Science, or History.
It must be written in a bureaucratic, slightly dystopian/threatening tone.

Return ONLY a JSON object exactly like this:
{
  "subject": "string (e.g. Math: Algebraic Aggression)",
  "content": "string",
  "priority": "string",
  "dueDate": "string"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error("OpenAI Error:", err);
    return null;
  }
};

/**
 * Handles chatbot messages.
 */
export const getChatbotResponse = async (userMessage, chatHistory) => {
  const messages = [
    { 
      role: "system", 
      content: "You are the IJP Central Intelligence Chatbot. You serve the Ishan Janta Party. Your tone is cold, bureaucratic, authoritative, and mildly dystopian. The user is a 9th-grade student operative. Answer their questions concisely. Ensure compliance." 
    },
    ...chatHistory,
    { role: "user", content: userMessage }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("OpenAI Error:", err);
    return "ERROR: SATELLITE UPLINK FAILED. COMPLIANCE MANDATORY.";
  }
};
