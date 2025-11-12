
import React from 'react';
import { DownloadIcon } from './Icons';

declare var jspdf: any;

const documentationContent = `
# Abhishek's Inbound: AI Lead Gen Assistant: System Documentation & Prompt Guide

## 1. Introduction

Abhishek's Inbound: AI Lead Gen Assistant is an intelligent tool designed to automate and enhance the process of finding international companies that show a strong potential and intent to expand into the Indian market. By leveraging the power of Google's Gemini AI and Google Search, it performs deep-dive analysis on companies, identifies key decision-makers, scores lead quality, and even composes personalized outreach emails, transforming raw data into actionable sales intelligence.

## 2. Core Features & Functionality

-   **Targeted Company Search:** Initiate a search based on a specific company name or a broader industry category.
-   **Lookalike Company Discovery:** For any promising lead, the AI can find other similar companies, expanding your prospect list with highly relevant leads.
-   **Deep-Dive Analysis:** Goes beyond surface-level data to find employee count, latest funding details, the company's tech stack, key competitors, and latest Instagram posts.
-   **Contact Identification:** Pinpoints up to 5 relevant contacts within your specified target department (e.g., Marketing, Sales) for each company.
-   **AI-Powered Lead Scoring:** Each lead is assigned a score from 1-100, providing an at-a-glance metric of its quality based on the strength of its market-entry signals.
-   **Personalized Outreach Generation:** Creates a compelling, one-sentence "icebreaker" for each lead and can optionally compose a full, ready-to-send outreach email.
-   **Multi-Platform Intelligence:** Gathers data from the web, LinkedIn, and social media (Facebook, X, Instagram, etc.) to build a holistic view of a company's activities and intent.
-   **Data Export:** Easily export all generated data into ".csv", ".xlsx" (with clickable links and multiple sheets for clarity), or copy it for pasting into Google Sheets.
-   **Session Persistence:** Your last search query and results are automatically saved and reloaded when you reopen the app, allowing you to pick up right where you left off.

## 3. Benefits of Use

-   **Time Savings:** Drastically reduces the hours spent on manual research and data collection.
-   **Increased Efficiency:** Focus your sales efforts on pre-qualified, high-intent leads.
-   **Actionable Intelligence:** Provides not just data, but context and justification for why each company is a good lead.
-   **Improved Outreach Personalization:** Start conversations with relevant, data-driven icebreakers and emails, significantly increasing response rates.
-   **Uncover Hidden Opportunities:** The AI's ability to find lookalike companies helps you discover promising leads you might have otherwise missed.

## 4. Usage Guide

1.  **Fill the Search Form:**
    *   **Client Name (Optional):** Enter a specific company name for a deep-dive analysis. If you check "Also find similar companies," the AI will research this primary company AND find others like it.
    *   **Client Category:** If you don't have a specific company in mind, choose an industry category to find multiple leads within it.
    *   **Target Department:** Select the department where you want the AI to find contacts (e.g., Marketing).
    *   **Search Platforms & Options:** Check the sources you want the AI to use. "Social Media Search (FB, X, Instagram)" will gather social signals. Check "Generate AI Outreach Email" to have a full email composed for each lead.
    *   **Target Region:** Specify the geographical region of the companies you are targeting.

2.  **Generate Leads:** Click the "Generate Leads" button. The AI will begin its research. This may take a minute or two as it performs a comprehensive analysis.

3.  **Review Results:**
    *   Leads will appear in the results table, ranked by their Lead Score.
    *   **Deep Dive:** Click the chevron (v) icon in the "Actions" column to expand a row and see detailed information like funding, tech stack, competitors, and recent Instagram posts.
    *   **Find Lookalikes:** Click the sparkles icon (✨) to task the AI with finding more companies similar to that specific lead.
    *   **Export:** Use the buttons at the top right of the results table to download your data in your preferred format. The .xlsx file contains separate, detailed sheets for news and Instagram posts.

## 5. Core AI Prompt Architecture

This is the exact blueprint used to instruct the Gemini model. It's constructed dynamically based on your form inputs.

---

### 5.1. System Instruction

This high-level directive sets the AI's persona and overall goal for every request.

\`\`\`
You are a world-class lead generation expert and sales strategist. Your purpose is to identify international companies showing strong potential for expanding into the Indian market. For each company, you must perform deep analysis to score the lead's quality and provide a personalized outreach suggestion. You must follow all instructions precisely and return data ONLY in the specified JSON array format.
\`\`\`

### 5.2. Main Content Prompt

This is the detailed task description, built from your form selections.

#### A. Task Description (Example)

*This part changes based on your inputs.*
\`\`\`
Your primary task is a deep-dive investigation into the company "InnovateTech" in the "Technology" category, which is based in the "USA" region. In addition to this, identify up to 5 other international companies that are similar to "InnovateTech" in business model and category, also from the "USA" region and showing strong potential for Indian market expansion. For all companies found (the primary one and the similar ones), find contacts in the "Marketing" department.

**IMPORTANT EXCLUSION RULE:** You MUST NOT include any of the following companies in your results, even if they are a perfect match: Competitor A, Old Prospect Inc.
\`\`\`

#### B. Search Methods

*This part is built from the "Search Platforms" checkboxes.*
\`\`\`
**Search Methods:**
- In-depth Web Search: Look for news, press releases, or reports about international expansion, funding for emerging markets, or partnerships in the Asia-Pacific region.
- LinkedIn: Scan for companies posting jobs in India or showing increased engagement from Indian professionals.
- Social Media (Facebook, X, Instagram, Reddit, etc.): Analyze mentions, discussions, and official posts from Indian users or related to Indian market interest to gauge organic engagement and expansion signals.
\`\`\`

#### C. Data Gathering & Verification Rules

*These are the strict rules the AI must follow for data collection and contact verification.*
\`\`\`
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
    - latestInstagramPosts: An array of up to 5 of the company's most recent Instagram posts. Each object in the array should contain 'caption' and 'url' (direct link to the post). If no Instagram profile is found or there are no posts, return an empty array [].
    - composedEmail: A full, personalized, and professional outreach email (3-4 paragraphs) ready to send. It should be friendly, concise, and professional. Start with the 'outreachSuggestion' as an opener, briefly expand on the 'justification' to show you've done your research, explain the value proposition for Indian expansion, and end with a clear, low-friction call-to-action (e.g., "Would you be open to a brief 15-minute call next week to explore this further?"). The email should be addressed to the primary contact you've identified.

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
\`\`\`

#### D. Output Format & Example

*This ensures the AI returns data in a structured, machine-readable format that the application can parse.*
\`\`\`
**Output Format:**
Your entire response MUST be a single, valid JSON array of lead objects. Do NOT include any text, explanations, or markdown before or after the array. The response must start with '[' and end with ']'. All strings must be properly JSON-escaped.

**Example Object:**
{
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
  "latestIndiaNews": { "title": "Example Corp Partners with Indian Distributor", "url": "https://www.example.com/news/india-partnership" },
  "latestInstagramPosts": [{ "caption": "Our new product launch!", "url": "https://www.instagram.com/p/Cxyz..." }, { "caption": "Team photo from the annual offsite!", "url": "https://www.instagram.com/p/Cabc..." }],
  "composedEmail": "Subject: Exploring Example Corp's Expansion into India\\n\\nHi Jane Doe,\\n\\nI saw your recent press release about expanding into the APAC region and was very impressed with your growth. Given your focus on global markets, the Indian market seems like a significant opportunity for Example Corp.\\n\\nMy company specializes in helping Technology companies like yours successfully launch in India, navigating the unique market landscape to drive rapid growth.\\n\\nWould you be open to a brief 15-minute call next week to explore how we could support your potential expansion?\\n\\nBest regards,\\n[Your Name]",
  "contacts": [
    { "contactName": "Jane Doe", "designation": "VP of Marketing", "contactLinkedIn": "https://www.linkedin.com/in/janedoe-example" },
    { "contactName": "John Smith", "designation": "Marketing Director", "contactLinkedIn": "Not found" }
  ]
}
\`\`\`
`;

interface DocumentationProps {
  onClose: () => void;
}

const Documentation: React.FC<DocumentationProps> = ({ onClose }) => {

  const handleDownload = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const addText = (text: string, options: { size?: number; style?: string; indent?: number; isCode?: boolean }) => {
        // Add new page if cursor is at the bottom
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }

        const { size = 10, style = 'normal', indent = 0, isCode = false } = options;
        
        doc.setFontSize(size);
        
        if (isCode) {
            doc.setFont('courier', 'normal');
        } else {
            doc.setFont('helvetica', style);
        }

        const lines = doc.splitTextToSize(text, maxLineWidth - indent);
        doc.text(lines, margin + indent, cursorY);
        
        // Calculate height of the text block
        const textHeight = (lines.length * (size * 0.35)) + 2;
        cursorY += textHeight;

        // Check again if new page is needed after adding text
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
    };

    const lines = documentationContent.split('\n');
    let inCodeBlock = false;

    for (const line of lines) {
        if (line.trim() === '---') {
            cursorY += 5;
            doc.setDrawColor(203, 213, 225); // slate-300
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += 5;
            continue;
        }
        if (line.trim().startsWith('\`\`\`')) {
            inCodeBlock = !inCodeBlock;
            cursorY += 2; 
            continue;
        }

        if (inCodeBlock) {
            // Remove leading spaces for better alignment in code block
            addText(line.replace(/^ /g, ''), { isCode: true, size: 8 });
        } else if (line.startsWith("# Abhishek's Inbound")) {
            addText(line.substring(2), { size: 18, style: 'bold' });
            cursorY += 2;
        } else if (line.startsWith('## ')) {
            cursorY += 6;
            addText(line.substring(3), { size: 14, style: 'bold' });
            cursorY += 2;
        } else if (line.startsWith('### ')) {
            cursorY += 4;
            addText(line.substring(4), { size: 12, style: 'bold' });
             cursorY += 1;
        } else if (line.startsWith('-   ')) {
            addText(`• ${line.substring(4)}`, { indent: 5 });
        } else if (line.trim() === '') {
            cursorY += 4; // Add space for empty lines
        }
        else {
            addText(line, {});
        }
    }

    doc.save('Abhisheks_Inbound_Lead_Gen_Assistant_Documentation.pdf');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-100">Application Documentation</h2>
          <div className="flex items-center gap-4">
             <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300">
                <DownloadIcon className="w-5 h-5" /> <span>Download (.pdf)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>
        <pre className="p-6 overflow-y-auto whitespace-pre-wrap font-sans text-slate-300 text-sm flex-grow">
            <code>
                {documentationContent}
            </code>
        </pre>
      </div>
    </div>
  );
};

export default Documentation;