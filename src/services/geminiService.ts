import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function explainCode(code: string, language: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain the following ${language} code concisely:\n\n\`\`\`${language}\n${code}\n\`\`\``,
  });
  return response.text;
}

export async function suggestFix(code: string, language: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following ${language} code for errors and suggest a fix:\n\n\`\`\`${language}\n${code}\n\`\`\``,
  });
  return response.text;
}
