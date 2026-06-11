import { GoogleGenerativeAI } from '@google/generative-ai';

// In a real production app, move this to process.env.GEMINI_API_KEY
const API_KEY = "AIzaSyBrYyRNsuqSg4fpQ1FZixMXTnssX1QqICw";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates optimized product content using Gemini AI
 */
export const generateProductMetadata = async ({ name, category }) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    Act as an e-commerce SEO expert. 
    Based on the product name "${name}" and category "${category}", generate high-quality product details.
    Return a strictly valid JSON object with the following keys:
    - title: A professional, catchy product title (max 80 characters).
    - description: A persuasive, SEO-optimized product description including features and benefits (at least 2 paragraphs).
    - tags: An array of 6 relevant search keywords (lowercase).
    - category: The most appropriate category if "${category}" is too broad.

    Output JSON ONLY. Do not include markdown formatting or backticks.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON if AI includes markdown backticks accidentally
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI response format was invalid');
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error('Gemini Generation Error:', error);
    throw new Error('AI was unable to generate content at this time. Please try again later.');
  }
};