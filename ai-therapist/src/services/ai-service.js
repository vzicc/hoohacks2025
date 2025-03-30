import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with API key and correct version
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getAIResponse(userInput, context = '') {
  try {
    // Validate API key
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('API key not found. Please add VITE_GEMINI_API_KEY to your .env file');
    }

    // Simplify model initialization
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Changed model name
    
    const prompt = `You are a helpful AI health assistant. Keep your responses concise and friendly. 
    Previous conversation context:
    ${context}
    
    User input: ${userInput}
    
    Consider the context of the previous conversation when responding. If the user refers to something 
    mentioned earlier, use that information in your response.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Service Error:', error);
    if (error.message.includes('API key')) {
      return "System configuration error. Please make sure the API key is properly set up.";
    }
    if (error.message.includes('404')) {
      return "There was an issue connecting to the AI service. Please check your API key and try again.";
    }
    return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
  }
}
