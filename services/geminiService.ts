
import { GoogleGenAI } from "@google/genai";

/**
 * Initialize the GoogleGenAI client using named parameter as per guidelines.
 */
const getAIClient = () => {
  // Fix: Use direct access to process.env.API_KEY as per instructions.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Uses gemini-3-pro-preview for complex analysis
 */
export const analyzeAttendanceData = async (data: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this student attendance data and provide key insights and recommendations for the school principal. Data: ${data}`,
    config: {
      // Thinking budget for gemini-3-pro-preview
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response.text;
};

/**
 * Uses gemini-flash-lite-latest for quick summaries
 */
export const getQuickSummary = async (data: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    // Fix: Use the correct model name 'gemini-flash-lite-latest' as per guidelines.
    model: 'gemini-flash-lite-latest',
    contents: `Summarize this attendance data briefly for parents. Data: ${data}`,
  });
  return response.text;
};
