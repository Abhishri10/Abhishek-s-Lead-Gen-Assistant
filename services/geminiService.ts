
import { GoogleGenAI } from "@google/genai";
import type { Lead, CompetitorAnalysis, ScoreExplanation } from '../types';

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
    - justification: A brief, high-level summary (2-3 sentences) of why this company is a strong lead for Indian market expansion.
    - marketEntrySignals: An array of 3-5 specific, verifiable bullet points that support the justification (e.g., "Recent $50M funding for global expansion", "Job posting for Head of Sales, India", "CEO mentioned APAC focus in a recent podcast").
    - leadScore: A numerical score from 1-100 indicating the strength of the lead, where 100 is the strongest. Base this on the recency and relevance of their expansion signals (e.g., recent funding, job postings, official announcements).
    - outreachSuggestion: A single, compelling sentence to use as a personalized icebreaker in an outreach email, directly referencing the 'justification' and 'marketEntrySignals'.
    - employeeCount: Estimated number of employees (e.g., "51-200").
    - latestFunding: Details of the most recent funding round (e.g., "$50M Series B - Oct 2023"). Use "N/A" if not found.
    - techStack: An array of key technologies the company uses (e.g., ["Salesforce", "AWS", "Shopify"]).
    - competitors: An array of 2-3 main competitors.
    - swotAnalysis: An object with four arrays of strings: 'strengths', 'weaknesses', 'opportunities', and 'threats'. Each array should contain 2-3 brief bullet points analyzing the company's potential for Indian market entry.
    - painPointAnalysis: An array of 2-3 potential business pain points. For each, identify a specific 'painPoint' the company likely faces (based on SWOT analysis, industry trends, or recent news) and a 'suggestedSolution' which is a one-sentence pitch on how your service could solve it.
    - latestNews: An object containing the 'title' and 'url' of the most recent, relevant general news article about the company (e.g. funding, product launch). The URL must be a direct link. If none, return an object with "N/A" for both title and url.
    - latestIndiaNews: An object containing the 'title' and 'url' of the most recent news, press release, or significant public statement specifically mentioning the company's interest, plans, or activities related to the Indian market. The URL must be a direct link. If no such specific news is found, return an object with "N/A" for both title and url.
    - instagramProfileUrl: The full URL to the company's official Instagram profile. Use "N/A" if not found.
    - latestInstagramPosts: An array of up to 5 of the company's most recent Instagram posts. Each object in the array should contain 'caption' and 'url'. The 'url' MUST be a direct, publicly accessible link to the specific post (e.g., https://www.instagram.com/p/Cxyz...). If you can find the post's caption but not its specific URL, use the main instagramProfileUrl as the post's URL. If no profile is found, return an empty array [].

2.  **Contacts (Find up to 5 people in the specified department):**
    For each potential contact, you MUST perform this verification:
    1. Find their LinkedIn profile using a targeted search.
    2. **Verify (ALL MUST BE TRUE):**
        a. **Company:** Current company on LinkedIn EXACTLY matches the researched company.
        b. **Strict Region Match:** The contact's location listed on their LinkedIn profile MUST be within the specified search region. For instance, if the target region is 'UK/Europe', the contact's location must be in a country within the UK or Europe. This is a non-negotiable rule. If a contact's location is outside the target region, you MUST DISCARD them and find another contact who is located within the region.
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
        const parsed = JSON.parse(jsonText);
        // Basic validation to ensure the AI didn't return a single object instead of an array
        if (!Array.isArray(parsed)) {
            throw new Error("AI response was a single object, but an array was expected.");
        }
        return parsed;
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
    generateOutreachCadence: boolean,
    exclusionList: string,
    outreachTone: string
): Promise<Lead[]> => {
  if ((!category.trim() && !clientName.trim()) || !department || platforms.length === 0) {
    return [];
  }
  
  let platformInstructions = '';
  if (platforms.includes('generalWeb')) {
    platformInstructions += `- In-depth Web Search: Look for news, press releases, or reports about international expansion, funding for emerging markets, or partnerships in the Asia-Pacific region.\n`;
  }
  if (platforms.includes('linkedIn')) {
    platformInstructions += `- LinkedIn: Scan for companies posting jobs in India or showing increased engagement from Indian professionals.\n`;
  }
  if (platforms.includes('socialMedia')) {
    platformInstructions += `- Social Media (Facebook, X, Instagram, Reddit, etc.): Analyze mentions, discussions, and official posts from Indian users or related to Indian market interest to gauge organic engagement and expansion signals.\n`;
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

    if (exclusionList.trim()) {
      taskDescription += `\n\n**IMPORTANT EXCLUSION RULE:** You MUST NOT include any of the following companies in your results, even if they are a perfect match: ${exclusionList.trim()}.`;
    }
    
  let currentDataGatheringRules = dataGatheringRules;
  let jsonExampleFields = `
  "companyName": "Example Corp",
  "category": "Technology",
  "companyLinkedIn": "https://www.linkedin.com/company/example-corp",
  "justification": "Recent press releases and a new funding round strongly indicate a push towards global expansion, with APAC being a specifically mentioned target market.",
  "marketEntrySignals": ["Raised $25M Series C for 'global expansion'", "Job posting for 'Business Development Manager, APAC'", "Partnered with a logistics firm in Singapore"],
  "email": "contact@example.com",
  "phone": "+1-555-123-4567",
  "leadScore": 85,
  "outreachSuggestion": "I saw your recent press release about expanding into the APAC region and was very impressed with your growth.",
  "employeeCount": "201-500",
  "latestFunding": "$25M Series C - Jan 2024",
  "techStack": ["React", "Node.js", "Google Cloud"],
  "competitors": ["Competitor Inc", "Another Corp"],
  "swotAnalysis": {
      "strengths": ["Strong brand recognition", "Innovative product line"],
      "weaknesses": ["No existing physical presence in Asia", "Pricing may be high for the Indian market"],
      "opportunities": ["Large untapped consumer base in India", "Growing demand for high-tech solutions"],
      "threats": ["Intense local competition", "Complex regulatory landscape"]
  },
  "painPointAnalysis": [
      {
          "painPoint": "Difficulty navigating complex Indian import regulations, potentially delaying market entry.",
          "suggestedSolution": "Our local logistics expertise can streamline your customs clearance process, ensuring a faster launch."
      },
      {
          "painPoint": "High customer acquisition costs in a competitive, price-sensitive market.",
          "suggestedSolution": "We can help you implement a targeted digital marketing strategy that lowers your cost-per-lead by up to 30%."
      }
  ],
  "latestNews": { "title": "Example Corp Raises $25M for Global Expansion", "url": "https://www.example.com/news/series-c" },
  "latestIndiaNews": { "title": "Example Corp Partners with Indian Distributor", "url": "https://www.example.com/news/india-partnership" },
  "instagramProfileUrl": "https://www.instagram.com/examplecorp",
  "latestInstagramPosts": [{ "caption": "Our new product launch!", "url": "https://www.instagram.com/p/Cxyz..." }, { "caption": "Team photo from the annual offsite!", "url": "https://www.instagram.com/p/Cabc..." }]`;

  if (generateOutreachCadence) {
    const toneInstruction = outreachTone && outreachTone !== 'Default (Professional)'
      ? ` The tone of the emails should be **${outreachTone}**.`
      : '';
      
    currentDataGatheringRules += `
    - outreachCadence: An array of 2-3 personalized, professional outreach email objects ready to send.${toneInstruction} Each object must contain 'step', 'subject', and 'body'. The sequence should be a logical progression (e.g., initial outreach, gentle follow-up). The first email should use the 'outreachSuggestion' as an opener, briefly expand on the 'justification' and 'marketEntrySignals' to show you've done your research, explain a value proposition for Indian expansion, and end with a clear, low-friction call-to-action. The email should be addressed to the primary contact you've identified.`;
    jsonExampleFields += `,
  "outreachCadence": [
      { 
          "step": 1, 
          "subject": "Exploring Example Corp's Expansion into India", 
          "body": "Hi Jane Doe,\\n\\nI saw your recent press release about expanding into the APAC region and was very impressed with your growth. Given your focus on global markets, the Indian market seems like a significant opportunity for Example Corp.\\n\\nMy company specializes in helping Technology companies like yours successfully launch in India, navigating the unique market landscape to drive rapid growth.\\n\\nWould you be open to a brief 15-minute call next week to explore how we could support your potential expansion?\\n\\nBest regards,\\n[Your Name]"
      },
      {
          "step": 2,
          "subject": "Re: Exploring Example Corp's Expansion into India",
          "body": "Hi Jane Doe,\\n\\nJust wanted to gently follow up on my previous email. I'm confident that our market-entry strategies could greatly benefit Example Corp as you continue your APAC expansion.\\n\\nI'd be happy to share a brief case study on how we helped a similar company achieve a 200% ROI in their first year in India. Let me know if that's of interest.\\n\\nBest regards,\\n[Your Name]"
      }
  ]`
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
    department: string,
    exclusionList: string
): Promise<Lead[]> => {
    
    let taskDescription = `Your task is to identify up to 5 international companies that are "lookalikes" of an existing lead, "${seedLead.companyName}". These new companies should also be from the "${region}" region and be strong candidates for expanding into the Indian market. Use the seed lead's category ("${seedLead.category}") and business model as a template. For each new company, find contacts in the "${department}" department. You MUST generate all the same data points for these new leads as specified in the Data Gathering Rules.`;

    if (exclusionList.trim()) {
      taskDescription += `\n\n**IMPORTANT EXCLUSION RULE:** You MUST NOT include any of the following companies in your results, even if they are a perfect match: ${exclusionList.trim()}.`;
    }

    const seedLeadInfo = `
**Seed Lead Information for Reference:**
- Company: ${seedLead.companyName}
- Category: ${seedLead.category}
- Justification for Indian Market Expansion: ${seedLead.justification}
`;
    
    // NOTE: Lookalikes will not generate outreach emails to keep the task focused.
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

export const analyzeCompetitor = async (
    competitorName: string,
    leadContext: Lead,
    region: string,
): Promise<CompetitorAnalysis> => {
    const systemInstruction = `You are a concise and accurate market intelligence analyst. Your goal is to provide a brief but insightful competitor analysis. Return data ONLY in the specified JSON format.`;

    // Fix: Pass region as an argument and use it in the prompt instead of leadContext.region
    const prompt = `
    Analyze the company "${competitorName}". This company is a competitor to "${leadContext.companyName}" in the "${leadContext.category}" industry, likely operating in or targeting the "${region}" region.

    Provide the following information in a valid JSON object:
    1.  **analysis**: A brief paragraph (3-4 sentences) summarizing the competitor's market position, recent activities, and potential threat level, especially concerning international or Indian market expansion.
    2.  **marketShare**: An estimated market share in their primary market or region (e.g., "5-7%", "Leading", "Niche Player"). Use "N/A" if not publicly available.
    3.  **recentNews**: An object with 'title' and 'url' for their most recent significant news article (e.g., funding, major partnership, product launch). The URL must be a direct link. If none, return an object with "N/A" for both title and url.

    **Output Format:**
    Your entire response MUST be a single, valid JSON object. Do NOT include any text, explanations, or markdown.
    
    **Example:**
    {
        "analysis": "Competitor Inc is a major player in the space, known for its aggressive pricing. They recently secured a partnership that could accelerate their APAC expansion, posing a direct challenge to ${leadContext.companyName}'s plans in India.",
        "marketShare": "15-20%",
        "recentNews": {
            "title": "Competitor Inc Partners with Global Distributor",
            "url": "https://www.example.com/news/competitor-partnership"
        }
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}],
                temperature: 0.2,
            },
        });
        
        const jsonText = response.text.trim();
        const startIndex = jsonText.indexOf('{');
        const endIndex = jsonText.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            return JSON.parse(jsonText.substring(startIndex, endIndex + 1));
        }
        throw new Error("Could not find a valid JSON object in the response.");
        
    } catch (error) {
        console.error("Error analyzing competitor:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get competitor analysis from AI: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the competitor.");
    }
};

export const explainLeadScore = async (lead: Lead): Promise<ScoreExplanation> => {
    const systemInstruction = `You are a helpful sales analyst. Your task is to concisely explain the reasoning behind a lead's quality score based on the provided data. Return the explanation in the specified JSON format.`;
    
    const prompt = `
    Lead Information:
    - Company Name: ${lead.companyName}
    - Lead Score Given: ${lead.leadScore} out of 100
    - AI's Justification: "${lead.justification}"
    - Key Market Entry Signals: 
      ${lead.marketEntrySignals.map(s => `- ${s}`).join('\n')}

    Task:
    Based *only* on the information above, explain why this lead received a score of ${lead.leadScore}. Do not invent new information.

    Provide the following in a valid JSON object:
    1.  **explanation**: A brief paragraph (2-3 sentences) summarizing the core reasons for the score.
    2.  **bulletPoints**: An array of 2-4 key factors (strings) that most heavily influenced this score (e.g., "Recent, relevant funding round", "Specific job posting for the target market", "High-value partnership indicating expansion intent").

    **Output Format:**
    Your entire response MUST be a single, valid JSON object. Do NOT include any text, explanations, or markdown.

    **Example:**
    {
        "explanation": "The score of 85 is primarily driven by a recent and substantial funding round explicitly aimed at global expansion, coupled with a specific, high-level job posting for the APAC region. These signals indicate strong, actionable intent.",
        "bulletPoints": [
            "Raised $25M Series C for 'global expansion'",
            "Active job posting for 'Business Development Manager, APAC'",
            "Partnership with a Singaporean logistics firm shows operational planning"
        ]
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Flash is sufficient for this focused task
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
            },
        });

        const jsonText = response.text.trim();
        const startIndex = jsonText.indexOf('{');
        const endIndex = jsonText.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            return JSON.parse(jsonText.substring(startIndex, endIndex + 1));
        }
        throw new Error("Could not find a valid JSON object in the AI response.");

    } catch (error) {
        console.error("Error explaining lead score:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get score explanation from AI: ${error.message}`);
        }
        throw new Error("An unknown error occurred while explaining the lead score.");
    }
};