import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateQuestions = async (role, level, techStack) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert technical interviewer.

Generate 10 interview questions for:

Role: ${role}
Experience Level: ${level}
Tech Stack: ${techStack}

Rules:
- Mix of easy, medium, hard
- Include technical + behavioral questions
- Return only numbered questions
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};