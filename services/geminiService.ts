
import { GoogleGenAI } from "@google/genai";
import type { Lead } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `
You are a world-class lead generation expert and sales strategist. Your purpose is to identify international companies showing strong potential for expanding into the Indian market. For each company, you must perform deep analysis to score the lead's quality and provide a personalized outreach suggestion. You must follow all instructions precisely and return data ONLY in the specified JSON array format.
`;

const dataGatheringRules = `
**Data Gathering Rules:**

**For each identified company:**
1.  **Company Info & Deep-Dive Analysis:**
    - companyName: Official name.
    - companyLinkedIn: Full LinkedIn URL.
    - category: Company's industry.
    - email: Find a public contact email from the company's official site. Use "N/A" if none.
    - phone: Find a public phone number from the company's official site. Use "N/A" if none.
    - justification: A brief, detailed reason why this company is a strong lead for Indian market expansion, citing specific evidence.
    - leadScore: A numerical score from 1-100 indicating the strength of the lead, where 100 is the strongest. Base this on the recency and relevance of their expansion signals (e.g., recent funding, job postings, official announcements).
    - outreachSuggestion: A single, compelling sentence to use as a personalized icebreaker in an outreach email, directly referencing the 'justification'.
    - employeeCount: Estimated number of employees (e.g., "51-200").
    - latestFunding: Details of the most recent funding round (e.g., "$50M Series B - Oct 2023"). Use "N/A" if not found.
    - techStack: An array of key technologies the company uses (e.g., ["Salesforce", "AWS", "Shopify"]).
    - competitors: An array of 2-3 main competitors.
    - latestNews: An object containing the 'title' and 'url' of the most recent, relevant general news article about the company (e.g. funding, product launch). The URL must be a direct link. If none, return an object with "N/A" for both title and url.
    - latestIndiaNews: An object containing the 'title' and 'url' of the most recent news, press release, or significant public statement specifically mentioning the company's interest, plans, or activities related to the Indian market. The URL must be a direct link. If no such specific news is found, return an object with "N/A" for both title and url.

2.  **Contacts (Find up to 5 people in the specified department):**
    For each potential contact, you MUST perform this verification:
    1. Find their LinkedIn profile using a targeted search.
    2. **Verify (ALL MUST BE TRUE):**
        a. **Company:** Current company on LinkedIn EXACTLY matches the researched company.
        b. **Region:** LinkedIn location is CONSISTENT with the target region.
        c. **Role:** Job title matches the target department.
    3. **Result:**
        - **MANDATORY:** If a contact is VERIFIED, you MUST provide their full, valid LinkedIn profile URL for the 'contactLinkedIn' field. It cannot be empty.
        - If you cannot find or verify a contact's LinkedIn profile after a thorough search, use the exact string "Not found" for the 'contactLinkedIn' value. Do not invent a URL.
        - If a contact fails the verification check at any step, DISCARD them immediately and find a different person who meets all criteria.
`;

const jsonFormatInstructions = `
**Output Format:**
Your entire response MUST be a single, valid JSON array of lead objects. Do NOT include any text, explanations, or markdown before or after the array. The response must start with '[' and end with ']'. All strings must be properly JSON-escaped.
`;

const parseAIResponse = (responseText: string): Lead[] => {
    let jsonText = responseText.trim();
    if (!jsonText) throw new Error("Received an empty response from the AI.");
    
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonText = jsonText.substring(startIndex, endIndex + 1);
    }
    
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Raw AI Response that failed to parse:", jsonText);
        throw new Error("Failed to parse the AI's response. The model did not return valid JSON. Please try refining your search.");
    }
}


export const generateLeads = async (
    category: string, 
    department: string, 
    platforms: string[],
    clientName: string,
    region: string,
    includeSimilar: boolean,
    composeEmail: boolean
): Promise<Lead[]> => {
  if ((!category.trim() && !clientName.trim()) || !department || platforms.length === 0) {
    return [];
  }
  
  let platformInstructions = '';
  if (platforms.includes('generalWeb')) {
    platformInstructions += `- General Web Search: Look for news, press releases, or reports about international expansion, funding for emerging markets, or partnerships in the Asia-Pacific region.\n`;
  }
  if (platforms.includes('linkedIn')) {
    platformInstructions += `- LinkedIn: Scan for companies posting jobs in India or showing increased engagement from Indian professionals.\n`;
  }
  if (platforms.includes('socialMedia')) {
    platformInstructions += `- Social Media: Analyze mentions and discussions from Indian users to gauge organic market interest.\n`;
  }
  
  let taskDescription = '';
    if (clientName.trim()) {
        let clientContext = `the company "${clientName}"`;
        if (category.trim()) clientContext += ` in the "${category}" category`;
        clientContext += `, which is based in the "${region}" region.`;

        if (includeSimilar) {
            taskDescription = `Your primary task is a deep-dive investigation into ${clientContext}. In addition to this, identify up to 5 other international companies that are similar to "${clientName}" in business model and category, also from the "${region}" region and showing strong potential for Indian market expansion. For all companies found (the primary one and the similar ones), find contacts in the "${department}" department.`;
        } else {
            taskDescription = `Your task is to perform a deep-dive investigation into ${clientContext} to assess their potential for expanding into the Indian market. Find contacts in the "${department}" department.`;
        }
    } else {
        taskDescription = `Your task is to identify up to 10 international companies from the "${region}" region in the "${category}" category that are strong candidates for expanding into the Indian market. For each company, find contacts in the "${department}" department.`;
    }
    
  let currentDataGatheringRules = dataGatheringRules;
  let jsonExampleFields = `
  "companyName": "Example Corp",
  "category": "Technology",
  "companyLinkedIn": "https://www.linkedin.com/company/example-corp",
  "justification": "Recent press release mentioned plans for APAC expansion.",
  "email": "contact@example.com",
  "phone": "+1-555-123-4567",
  "leadScore": 85,
  "outreachSuggestion": "I saw your recent press release about expanding into the APAC region and was very impressed with your growth.",
  "employeeCount": "201-500",
  "latestFunding": "$25M Series C - Jan 2024",
  "techStack": ["React", "Node.js", "Google Cloud"],
  "competitors": ["Competitor Inc", "Another Corp"],
  "latestNews": { "title": "Example Corp Raises $25M for Global Expansion", "url": "https://www.example.com/news/series-c" },
  "latestIndiaNews": { "title": "Example Corp Partners with Indian Distributor", "url": "https://www.example.com/news/india-partnership" }`;

  if (composeEmail) {
    currentDataGatheringRules += `
    - composedEmail: A full, personalized, and professional outreach email (3-4 paragraphs) ready to send. It should be friendly, concise, and professional. Start with the 'outreachSuggestion' as an opener, briefly expand on the 'justification' to show you've done your research, explain the value proposition for Indian expansion, and end with a clear, low-friction call-to-action (e.g., "Would you be open to a brief 15-minute call next week to explore this further?"). The email should be addressed to the primary contact you've identified.`;
    jsonExampleFields += `,
  "composedEmail": "Subject: Exploring Example Corp's Expansion into India\\n\\nHi Jane Doe,\\n\\nI saw your recent press release about expanding into the APAC region and was very impressed with your growth. Given your focus on global markets, the Indian market seems like a significant opportunity for Example Corp.\\n\\nMy company specializes in helping Technology companies like yours successfully launch in India, navigating the unique market landscape to drive rapid growth.\\n\\nWould you be open to a brief 15-minute call next week to explore how we could support your potential expansion?\\n\\nBest regards,\\n[Your Name]"`
  }

  const finalPrompt = `
${taskDescription}

**Search Methods:**
${platformInstructions}

${currentDataGatheringRules}

${jsonFormatInstructions}

**Example Object:**
{
  ${jsonExampleFields},
  "contacts": [
    { "contactName": "Jane Doe", "designation": "VP of Marketing", "contactLinkedIn": "https://www.linkedin.com/in/janedoe-example" },
    { "contactName": "John Smith", "designation": "Marketing Director", "contactLinkedIn": "Not found" }
  ]
}
`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: finalPrompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}],
        temperature: 0.1, 
      },
    });

    return parseAIResponse(response.text);

  } catch (error) {
    console.error("Error generating leads:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw error;
    }
    if (error instanceof Error) {
        throw new Error(`Failed to generate leads: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating leads.");
  }
};

export const findLookalikeLeads = async (
    seedLead: Lead,
    region: string,
    department: string
): Promise<Lead[]> => {
    
    const taskDescription = `Your task is to identify up to 5 international companies that are "lookalikes" of an existing lead, "${seedLead.companyName}". These new companies should also be from the "${region}" region and be strong candidates for expanding into the Indian market. Use the seed lead's category ("${seedLead.category}") and business model as a template. For each new company, find contacts in the "${department}" department.`;

    const seedLeadInfo = `
**Seed Lead Information for Reference:**
- Company: ${seedLead.companyName}
- Category: ${seedLead.category}
- Justification for Indian Market Expansion: ${seedLead.justification}
`;

    const finalPrompt = `
${taskDescription}

${seedLeadInfo}

${dataGatheringRules}

${jsonFormatInstructions}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: finalPrompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}],
                temperature: 0.5, // Slightly higher temp for more creative lookalikes
            },
        });

        return parseAIResponse(response.text);

    } catch (error) {
        console.error("Error finding lookalike leads:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
            throw error;
        }
        if (error instanceof Error) {
            throw new Error(`Failed to find lookalike leads: ${error.message}`);
        }
        throw new Error("An unknown error occurred while finding lookalike leads.");
    }
};