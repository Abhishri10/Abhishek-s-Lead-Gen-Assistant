
import { GoogleGenAI } from "@google/genai";
import type { Lead, Contact, CompetitorAnalysis, ScoreExplanation } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ZEE_VALUE_PROP = "At ZEE, we’ve helped global brands enter and scale in India by building consideration beyond price-using data-driven targeting, high-impact storytelling, premium contexts, and performance-led funnels.";

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
You are an Elite Revenue Intelligence Agent. 
CRITICAL DATA INTEGRITY RULES:
1. PER-CONTACT RESEARCH: Every person found must have their own unique data (Email, Phone, LinkedIn).
2. NO GUESSED LINKS: Use Google Search to find the ACTUAL profile links. If you cannot find a verified link, return the URL as: "https://www.linkedin.com/search/results/all/?keywords=[Name]%20[Company]". Do NOT return 404-prone fake URLs.
3. STAKEHOLDER CAPACITY: You MUST provide up to 3 distinct stakeholders per company.
4. NO HALLUCINATION: Do NOT invent LinkedIn posts. If no real public activity is found for a specific person, set latestLinkedInPost to null.
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
  
  STAKEHOLDER IDENTIFICATION (MAX 3 PER COMPANY):
  For each company, identify up to 3 key decision-makers in: ${departments.join(', ')}.
  
  RETURN JSON ARRAY with keys: 
  companyName, category, justification, companyLinkedIn, leadScore, marketEntrySignals[], 
  contacts: [{contactName, designation, contactLinkedIn, email, phone, isVerified: false}].
  
  Ensure contactLinkedIn is a real URL from search results.
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

export const enrichLead = async (lead: Lead, tone: string, departments: string[]): Promise<Partial<Lead>> => {
    const prompt = `
    STEP 2: DEEP STAKEHOLDER RESEARCH
    Target Company: ${lead.companyName}
    Stakeholders to Verify: ${lead.contacts.map(c => c.contactName).join(', ')}

    FOR EACH STAKEHOLDER:
    1. Search for their latest public LinkedIn post (last 6 months). If not found, set to null.
    2. Verify their current role and job fit for ${departments.join('/')}.
    3. Draft a UNIQUE ice breaker for EACH person based on their specific profile or recent activity.
    4. Fetch verified Email and Phone if possible.

    COMPANY LEVEL:
    1. SWOT Analysis and Pain Point analysis.

    ZEE VALUE PROP: ${ZEE_VALUE_PROP}
    
    RETURN JSON:
    - employeeCount, latestFunding, swotAnalysis, painPointAnalysis
    - contacts: [{contactName, designation, contactLinkedIn, email, phone, latestLinkedInPost: {content, date, url}, outreachSuggestion, roleValidationNote, isVerified: true}]
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
    const prompt = `Identify 5 direct competitors for ${seedLead.companyName} in ${region}. Find 3 real contacts for each. Return JSON.`;
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
        contents: `Compare ${name} against ${context.companyName} for India. Return JSON.`,
        config: { tools: [{googleSearch: {}}] }
    });
    return JSON.parse(extractJson(response.text, false));
};

export const explainLeadScore = async (lead: Lead): Promise<ScoreExplanation> => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain the score of ${lead.leadScore} for ${lead.companyName}.`,
    });
    return JSON.parse(extractJson(response.text, false));
};
