
import { GoogleGenAI } from "@google/genai";
import type { Lead, CompetitorAnalysis, ScoreExplanation } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ZEE_VALUE_PROP = "At ZEE, we’ve helped global brands enter and scale in India by building consideration beyond price-using data-driven targeting, high-impact storytelling, premium contexts, and performance-led funnels. Our portfolio includes 50+ linear channels, ZEE5 (OTT), multiple digital genre platforms, and a news network spanning global, national, and regional audiences.";

const extractJson = (text: string, isArray: boolean): string => {
    try {
        const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        let content = markdownMatch ? markdownMatch[1].trim() : text.trim();
        const startChar = isArray ? '[' : '{';
        const endChar = isArray ? ']' : '}';
        const startIndex = content.indexOf(startChar);
        const endIndex = content.lastIndexOf(endChar);
        if (startIndex !== -1 && endIndex !== -1) {
            return content.substring(startIndex, endIndex + 1);
        }
        return isArray ? "[]" : "{}";
    } catch (e) {
        return isArray ? "[]" : "{}";
    }
};

const systemInstruction = `
You are an Elite Revenue Intelligence Agent specializing in high-accuracy data extraction (similar to Clay or Apify).
Your goal is to identify international companies with high-intent expansion signals for the Indian market in 2025.
When researching, cross-reference multiple sources (LinkedIn, News, Crunchbase) to ensure "ground-truth" accuracy.
Always return strictly valid JSON.
`;

export const generateLeads = async (
    category: string, 
    departments: string[], 
    platforms: string[],
    clientName: string,
    region: string,
    includeSimilar: boolean,
    generateOutreachCadence: boolean,
    exclusionList: string,
    outreachTone: string,
    isAiSaas: boolean
): Promise<Lead[]> => {
  const prompt = `
  STEP 1: DISCOVERY
  Find 10 high-growth international companies in the "${category}" industry from ${region} that are NOT in this list: ${exclusionList}.
  
  CRITICAL CATEGORY FILTERING:
  - If the category is "Food", you must ONLY return results related to solid food products, snacks, meals, or ingredients. Do NOT include drinks or beverages.
  - If the category is "Beverages", you must ONLY return results related to drinks, soda, alcohol, water, coffee, tea, or liquid refreshments. Do NOT include solid food products.
  - For all other categories, adhere strictly to the industry definition.

  Focus on companies that have recently raised funds, launched APAC operations, or hired for remote India roles.
  
  RETURN JSON ARRAY with keys: companyName, category, justification, companyLinkedIn, email, phone, leadScore, marketEntrySignals (array), contacts: [{contactName, designation, contactLinkedIn}].
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { systemInstruction, tools: [{googleSearch: {}}] },
    });
    return JSON.parse(extractJson(response.text, true));
  } catch (error) {
      console.error("Discovery error:", error);
      return [];
  }
};

export const enrichLead = async (lead: Lead, tone: string): Promise<Partial<Lead>> => {
    const prompt = `
    STEP 2: ROBUST INTEL EXTRACTION (Clay/Apify Scraper Mode)
    Target Company: ${lead.companyName}
    
    1. Scan LinkedIn for recent executive hires related to India or APAC.
    2. Extract verified Firmographics (Employee count, Latest Funding amount).
    3. Identify specific technological "Pain Points" based on their current public tech stack.
    4. Perform a SWOT Analysis focusing on their 2025 India expansion readiness.
    5. Draft a personalized Ice Breaker that references a specific recent news event or LinkedIn post.
    6. Find the most recent verified news headline and URL.

    ZEE VALUE PROP CONTEXT: ${ZEE_VALUE_PROP}
    
    RETURN JSON with keys:
    - employeeCount, latestFunding, techStack (array), competitors (array)
    - swotAnalysis {strengths[], weaknesses[], opportunities[], threats[]}
    - painPointAnalysis [{painPoint, suggestedSolution}] (Solution must mention ZEE capabilities)
    - outreachSuggestion (The high-impact Ice Breaker)
    - latestNews {title, url}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { systemInstruction, tools: [{googleSearch: {}}] }
        });
        return JSON.parse(extractJson(response.text, false));
    } catch (error) {
        console.error("Enrichment error:", error);
        return {};
    }
};

export const findLookalikeLeads = async (seedLead: Lead, region: string, departments: string[], exclusionList: string): Promise<Lead[]> => {
    const prompt = `Identify 5 direct competitors or lookalikes for ${seedLead.companyName} within the ${region} region. Return JSON array.`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction, tools: [{googleSearch: {}}] },
    });
    return JSON.parse(extractJson(response.text, true));
};

export const analyzeCompetitor = async (name: string, context: Lead, region: string): Promise<CompetitorAnalysis> => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Compare ${name} against ${context.companyName} for the Indian market. Return JSON.`,
        config: { tools: [{googleSearch: {}}] }
    });
    return JSON.parse(extractJson(response.text, false));
};

export const explainLeadScore = async (lead: Lead): Promise<ScoreExplanation> => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain why ${lead.companyName} received a lead score of ${lead.leadScore} for Indian market expansion.`,
    });
    return JSON.parse(extractJson(response.text, false));
};
