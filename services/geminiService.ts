
import { GoogleGenAI } from "@google/genai";
import type { Lead, CompetitorAnalysis, ScoreExplanation, OutreachStep } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to robustly extract JSON from mixed text
const extractJson = (text: string, isArray: boolean): string => {
    // 1. Try to extract from markdown code block first
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
        const content = markdownMatch[1].trim();
        const start = isArray ? '[' : '{';
        // Basic check if it looks like the expected format
        if (content.startsWith(start)) {
            return content;
        }
    }

    // 2. Fallback to finding the bracket structure in the raw text
    const startChar = isArray ? '[' : '{';
    const endChar = isArray ? ']' : '}';
    const startIndex = text.indexOf(startChar);
    
    if (startIndex === -1) return text; 
    
    let balance = 0;
    let inString = false;
    let escape = false;
    
    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        
        if (!inString) {
            if (char === startChar) balance++;
            else if (char === endChar) {
                balance--;
                if (balance === 0) return text.substring(startIndex, i + 1);
            }
        }
    }
    
    // Fallback: if no balanced end found, try finding the last occurrence
    const lastIndex = text.lastIndexOf(endChar);
    if (lastIndex > startIndex) return text.substring(startIndex, lastIndex + 1);
    
    return text.substring(startIndex);
};

const systemInstruction = `
You are a relentless and world-class Lead Generation Researcher & Data Scraper. 
Your goal is to find high-value international companies expanding into the Indian market. 
You do not stop at surface-level results; you dig deep into social media signals, job boards, and press releases to find accurate, actionable intelligence.
Your output must be exhaustive, verified, and formatted strictly as a JSON array.
`;

const getBaseDataGatheringRules = (departments: string[]) => `
**Data Gathering & Verification Protocol:**

**For each identified company, you must perform a "Deep Search" to ensure accuracy:**

1.  **Company Info & Deep-Dive Analysis:**
    - companyName: Official name.
    - companyLinkedIn: Full LinkedIn URL.
    - category: Company's industry.
    - email: **SCRAPE HARD:** Look for "press@", "contact@", "hello@" or investor relations emails on their official site or press releases. Use "N/A" only if absolutely nothing is found after multiple attempts.
    - phone: Official HQ or regional office phone number.
    - justification: A specific, non-generic summary (2-3 sentences) of *why* they are a lead for India. Mention specific campaigns, hiring, or investments.
    - marketEntrySignals: An array of 3-5 **verified** bullet points (e.g., "Hiring 'Country Manager India' on LinkedIn", "Registered Indian subsidiary entity", "Launched '.in' website domain").
    - leadScore: A numerical score (1-100). High scores (80+) require *active* investment/hiring. Medium scores (60-79) imply *intent* or partnerships.
    - outreachSuggestion: A personalized icebreaker referencing a specific recent event found in your research.
    - employeeCount: Estimated global count.
    - latestFunding: Most recent funding round with date.
    - techStack: An array of confirmed technologies they use (check job descriptions for "skills required" to infer this).
    - competitors: 2-3 major competitors.
    - swotAnalysis: Detailed SWOT relative to the *Indian* market.
    - painPointAnalysis: 2-3 specific business challenges they likely face in India (e.g., regulatory hurdles, local competition).
    - latestNews: { title, url } of a general recent news article.
    - latestIndiaNews: { title, url } of a news article *specifically* linking them to India. **CRITICAL:** If they are entering India, this must exist.
    - instagramProfileUrl: Official Instagram handle.
    - latestInstagramPosts: Array of { caption, url } for up to 5 recent posts. **Simulate Scraping:** Look for posts with hashtags like #India, #NewLaunch, #Expansion.

2.  **Contacts (Find 3-5 key decision-makers across the following departments: ${departments.join(', ')}):**
    - Target the specific departments requested (${departments.join(', ')}).
    - **Verification:**
        - You MUST verify the person is currently at the company.
        - You MUST verify the person covers the target region (or Global/APAC roles).
        - **LinkedIn Scraping Simulation:** Use search queries like \`site:linkedin.com/in/ "Company Name" "Job Title"\` to find real profiles.
        - If a specific individual cannot be verified, find a generic department head or regional lead.
`;

const jsonFormatInstructions = `
**Output Format:**
Your entire response MUST be a single, valid JSON array of lead objects. Do NOT include any text, explanations, or markdown before or after the array. The response must start with '[' and end with ']'. All strings must be properly JSON-escaped.
`;

const parseAIResponse = (responseText: string): Lead[] => {
    if (!responseText) throw new Error("Received an empty response from the AI.");
    
    const jsonText = extractJson(responseText, true);

    try {
        const parsed = JSON.parse(jsonText);
        // Basic validation to ensure the AI didn't return a single object instead of an array
        if (!Array.isArray(parsed)) {
            throw new Error("AI response was a single object, but an array was expected.");
        }
        return parsed;
    } catch (error) {
        console.error("Raw AI Response that failed to parse:", responseText);
        throw new Error("Failed to parse the AI's response. The model did not return valid JSON. Please try refining your search.");
    }
}


export const generateLeads = async (
    category: string, 
    departments: string[], 
    platforms: string[],
    clientName: string,
    region: string,
    includeSimilar: boolean,
    generateOutreachCadence: boolean,
    exclusionList: string,
    outreachTone: string
): Promise<Lead[]> => {
  if ((!category.trim() && !clientName.trim()) || departments.length === 0 || platforms.length === 0) {
    return [];
  }
  
  // Enhanced Search Instructions simulating "Scraping"
  let platformInstructions = '**Advanced Search Strategy (Execute these queries via Google Search Tool):**\n';
  
  if (platforms.includes('generalWeb')) {
    platformInstructions += `- **News Scraping:** Search \`"${category}" "India expansion" "investing in India" "new office" site:news.google.com\` and industry-specific news portals.\n`;
    platformInstructions += `- **Corporate Signals:** Search \`"Company Name" "Investor Presentation" "India strategy" filetype:pdf\`.\n`;
    
    if (category === 'Airlines') {
        platformInstructions += `- **Aviation Source Scraping:** Search \`"launching flights to India" site:simpleflying.com OR site:aviationweek.com OR site:livemint.com\`.\n`;
        platformInstructions += `- **GSA Search:** Search \`"appointed General Sales Agent India" "${category}"\`.\n`;
    }
    if (category === 'Travel & Tourism') {
         platformInstructions += `- **Tourism Source Scraping:** Search \`"tourism board" "roadshow India" site:traveltrendstoday.in OR site:travelbizmonitor.com\`.\n`;
    }
  }
  if (platforms.includes('linkedIn')) {
    platformInstructions += `- **LinkedIn X-Ray:** Search \`site:linkedin.com/jobs "hiring" "${category}" "India"\` to find companies actively recruiting.\n`;
    platformInstructions += `- **Profile Scraping:** Search \`site:linkedin.com/in/ "${category}" "Head of India" OR "VP Asia" "Company Name"\` to find contacts.\n`;
  }
  if (platforms.includes('socialMedia')) {
    platformInstructions += `- **Social Signal Scraping:** Search \`site:instagram.com "${category}" "India" "coming soon"\` and \`site:facebook.com "${category}" "launching in India"\`.\n`;
    platformInstructions += `- **Twitter/X:** Search \`site:twitter.com "${category}" "entering India"\`.\n`;
    platformInstructions += `- **Reddit Intel:** Search \`site:reddit.com "${category}" "India" "coming to India" OR "launching" OR "rumors"\` to catch early discussions and insider news about market entry.\n`;
  }
  
  const deptString = departments.join(', ');

  let taskDescription = '';
    if (clientName.trim()) {
        let clientContext = `the company "${clientName}"`;
        if (category.trim()) clientContext += ` in the "${category}" category`;
        clientContext += `, which is based in the "${region}" region.`;

        if (includeSimilar) {
            taskDescription = `Your primary task is a deep-dive investigation into ${clientContext}. In addition to this, identify **5 to 8** other international companies that are similar to "${clientName}" in business model and category, also from the "${region}" region and showing strong potential for Indian market expansion. For all companies found, find contacts in the following departments: "${deptString}".`;
        } else {
            taskDescription = `Your task is to perform a deep-dive investigation into ${clientContext} to assess their potential for expanding into the Indian market. Find contacts in the following departments: "${deptString}".`;
        }
    } else {
        // Updated lead count to 10-12 to fit within output token limits while maintaining quality
        taskDescription = `Your task is to identify **10 to 12** high-potential international companies from the "${region}" region in the "${category}" category that are strong candidates for expanding into the Indian market. \n\n**CRITICAL QUALITY REQUIREMENT:** Prioritize the quality and depth of data over quantity. Find contacts in the following departments: "${deptString}".`;
    }
    
    if (category === 'Travel & Tourism') {
        taskDescription += `\n\n**IMPORTANT FOR TRAVEL & TOURISM:** 
        1. **Tourism Boards:** You MUST actively search for major **International Tourism Boards** or Destination Marketing Organizations (DMOs) from the "${region}" region (e.g., "Visit Britain", "Tourism Australia", "Swiss Travel System", "Visit Dubai"). Check for recent "Roadshows in India", "Sales Missions", or "SATTE participation".
        2. **Hotel Chains:** Look for international hotel chains announcing new properties in India.
        3. **Experience Providers:** Look for global tour operators (like Contiki, G Adventures) increasing their India inventory.
        `;
    }

    if (category === 'Airlines') {
        taskDescription += `\n\n**IMPORTANT FOR AIRLINES:**
        1. **New Routes:** Prioritize airlines announcing *direct* flights.
        2. **Code Shares & Interline:** If no direct flights, look for *expanded codeshare agreements* with Indian carriers (IndiGo, Air India, SpiceJet) which act as a market entry signal.
        3. **GSA Appointments:** Search aggressively for "appointed General Sales Agent (GSA) in India". This is a massive lead signal for airlines without physical offices.
        4. **Capacity:** Look for news about "increasing frequency" or "upgrading aircraft" to India routes.
        `;
    }

    if (exclusionList.trim()) {
      taskDescription += `\n\n**IMPORTANT EXCLUSION RULE:** You MUST NOT include any of the following companies in your results, even if they are a perfect match: ${exclusionList.trim()}.`;
    }
    
  let currentDataGatheringRules = getBaseDataGatheringRules(departments);
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
      model: "gemini-2.5-flash", // Use 2.5 Flash for speed and thinking capabilities
      contents: finalPrompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}],
        // Reduced thinking budget to avoid 500 internal errors (token overflow)
        // Default maxOutputTokens is ~8k. Budget must be significantly lower to leave room for the leads.
        thinkingConfig: { thinkingBudget: 2048 }, 
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
    departments: string[],
    exclusionList: string
): Promise<Lead[]> => {
    const deptString = departments.join(', ');
    
    // Reduced count to ensure stability
    let taskDescription = `Your task is to identify **5 to 8** international companies that are "lookalikes" of an existing lead, "${seedLead.companyName}". These new companies should also be from the "${region}" region and be strong candidates for expanding into the Indian market. Use the seed lead's category ("${seedLead.category}") and business model as a template. For each new company, find contacts in the following departments: "${deptString}". You MUST generate all the same data points for these new leads as specified in the Data Gathering Rules.`;

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

${getBaseDataGatheringRules(departments)}

${jsonFormatInstructions}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: finalPrompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}],
                thinkingConfig: { thinkingBudget: 2048 },
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
            model: "gemini-2.5-flash", // Use standard Flash for consistency
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}],
                temperature: 0.2,
            },
        });
        
        const jsonText = extractJson(response.text, false);
        return JSON.parse(jsonText);
        
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

        const jsonText = extractJson(response.text, false);
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error explaining lead score:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get score explanation from AI: ${error.message}`);
        }
        throw new Error("An unknown error occurred while explaining the lead score.");
    }
};

export const generateOutreachForLead = async (lead: Lead, tone: string): Promise<OutreachStep[]> => {
    const systemInstruction = `You are an expert sales copywriter. Your task is to write a personalized 2-step email outreach sequence.`;
    
    const contactPerson = lead.contacts && lead.contacts.length > 0 ? lead.contacts[0] : { contactName: 'Decision Maker', designation: 'Manager' };

    const prompt = `
    Context:
    My company helps international businesses successfully launch and expand into the Indian market.
    
    Target Lead:
    - Company: ${lead.companyName}
    - Contact: ${contactPerson.contactName} (${contactPerson.designation})
    - Expansion Signal: ${lead.justification}
    - Key Events: ${lead.marketEntrySignals.join('; ')}
    - Icebreaker Suggestion: ${lead.outreachSuggestion}
    
    Task:
    Write a sequence of 2 emails (an initial outreach and a follow-up) addressed to ${contactPerson.contactName}.
    Tone: ${tone}
    
    Structure:
    Email 1: Use the icebreaker, reference their expansion signals to show research, propose a value add regarding their India entry, and ask for a call.
    Email 2: A gentle, professional follow-up sent 3 days later, perhaps offering a case study or value nugget.

    Output Format:
    Return a valid JSON array of objects. Each object must have:
    - step: number (1 or 2)
    - subject: string
    - body: string (Use \\n for line breaks)
    
    **Output Format:**
    Your entire response MUST be a single, valid JSON array. Do NOT include any text, explanations, or markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            },
        });

        const jsonText = extractJson(response.text, true);
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating outreach for lead:", error);
        return [];
    }
};
