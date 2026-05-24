import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

const nvidia = new OpenAI({
  apiKey: import.meta.env.VITE_NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  dangerouslyAllowBrowser: true
});

const executeWithFallback = async (options) => {
  try {
    return await openai.chat.completions.create(options);
  } catch (err) {
    console.warn("OpenAI Failed, falling back to NVIDIA API:", err.message);
    try {
      // NVIDIA API might not support response_format json_object in all models, 
      // but meta/llama3-70b-instruct is robust. We adjust model name for NVIDIA.
      const fallbackOptions = { 
        ...options, 
        model: "meta/llama3-70b-instruct",
        // remove response_format if it causes issues, but we can try it first.
      };
      return await nvidia.chat.completions.create(fallbackOptions);
    } catch (nvErr) {
      console.error("NVIDIA API also failed:", nvErr);
      throw new Error("Central Intelligence and Backup Systems are currently offline.");
    }
  }
};

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
    const response = await executeWithFallback({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (err) {
    throw err;
  }
};

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
    const response = await executeWithFallback({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    return null;
  }
};

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
    const response = await executeWithFallback({
      model: "gpt-4o-mini",
      messages: messages,
    });

    return response.choices[0].message.content;
  } catch (err) {
    return "ERROR: SATELLITE UPLINK FAILED. COMPLIANCE MANDATORY.";
  }
};

