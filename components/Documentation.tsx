
import React from 'react';
import { DownloadIcon, DocumentIcon } from './Icons';

declare var jspdf: any;

const documentationContent = `
# Inbound- Revenue Intelligence Powerhouse: System Documentation & Prompt Guide

## 1. Introduction

Inbound- Revenue Intelligence Powerhouse is an intelligent tool designed to automate and enhance the process of finding international companies that show a strong potential and intent to expand into the Indian market. By leveraging the power of Google's Gemini AI and Google Search, it performs deep-dive analysis on companies, identifies key decision-makers, scores lead quality, and even composes personalized outreach emails, transforming raw data into actionable sales intelligence.

## 2. Core Features & Functionality

-   **Targeted Company Search:** Initiate a search based on a specific company name or a broader industry category.
-   **Lookalike Company Discovery:** For any promising lead, the AI can find other similar companies, expanding your prospect list with highly relevant leads.
-   **Deep-Dive Analysis:** Goes beyond surface-level data to find employee count, latest funding details, the company's tech stack, key competitors, and latest Instagram posts.
-   **Multi-Department Contact ID:** Select multiple departments (e.g., Marketing AND Sales) to find contacts across the organization for each company.
-   **AI-Powered Lead Scoring:** Each lead is assigned a score from 1-100, providing an at-a-glance metric of its quality based on the strength of its market-entry signals.
-   **Personalized Outreach Generation:** Creates a compelling, one-sentence "icebreaker" for each lead and can optionally compose a full, ready-to-send outreach email.
-   **Multi-Platform Intelligence:** Gathers data from the web, LinkedIn, and social media (Facebook, X, Instagram, Reddit, etc.) to build a holistic view of a company's activities and intent.
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
    *   **Target Departments:** Check one or multiple departments where you want the AI to find contacts (e.g., Marketing, CEO).
    *   **Search Platforms & Options:** Check the sources you want the AI to use. "Social Media Search (FB, X, Insta, Reddit)" will gather social signals and community discussions. Check "Generate AI Outreach Email" to have a full email composed for each lead.
    *   **Target Region:** Specify the geographical region of the companies you are targeting.

2.  **Generate Leads:** Click the "Generate Leads" button. The AI will begin its research. This may take a minute or two as it performs a comprehensive analysis.

3.  **Review Results:**
    *   Leads will appear in the results table, ranked by their Lead Score.
    *   **Deep Dive:** Click the chevron (v) icon in the "Actions" column to expand a row and see detailed information like funding, tech stack, competitors, and recent Instagram posts.
    *   **Find Lookalikes:** Click the sparkles icon (✨) to task the AI with finding more companies similar to that specific lead.
    *   **Export:** Use the buttons at the top right of the results table to download your data in your preferred format. The .xlsx file contains separate, detailed sheets for news and Instagram posts.
`;

const appOverviewDocContent = `
Inbound- Revenue Intelligence Powerhouse is a next-generation sales intelligence platform designed to bridge the gap between global innovations and the Indian market. Built on a modern tech stack comprising React 19, Tailwind CSS, and powered by the cutting-edge Google Gemini 3 model, the app functions as a sophisticated data scraper and researcher.

The platform specializes in identifying high-intent international leads—particularly in the 'AI & Technology' sector—by scanning LinkedIn, Social Media (Reddit, X, Instagram), and global news networks. It detects subtle expansion signals, such as hiring for India-specific roles or community adoption of tools like Kling AI and RunwayML.

Our Unique Selling Proposition (USP) lies in the depth of our automated research. Unlike traditional lead lists, this tool provides full SWOT analyses, verified decision-maker contacts across multiple departments, and pain-point mappings. Furthermore, it automates the creation of personalized outreach cadences that subtly weave in the ZEE value proposition, highlighting assets like ZEE5 and its massive news network spanning 50+ channels. With features like lead scoring and lookalike discovery, Inbound empowers sales teams to move beyond cold calling into high-impact, data-driven storytelling and targeted performance funnels.
`;

interface DocumentationProps {
  onClose: () => void;
}

const Documentation: React.FC<DocumentationProps> = ({ onClose }) => {

  const handleDownloadPDF = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const addText = (text: string, options: { size?: number; style?: string; indent?: number; isCode?: boolean }) => {
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
        const { size = 10, style = 'normal', indent = 0, isCode = false } = options;
        doc.setFontSize(size);
        if (isCode) { doc.setFont('courier', 'normal'); } else { doc.setFont('helvetica', style); }
        const lines = doc.splitTextToSize(text, maxLineWidth - indent);
        doc.text(lines, margin + indent, cursorY);
        const textHeight = (lines.length * (size * 0.35)) + 2;
        cursorY += textHeight;
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
    };

    const lines = documentationContent.split('\n');
    let inCodeBlock = false;
    for (const line of lines) {
        if (line.trim() === '---') {
            cursorY += 5; doc.setDrawColor(203, 213, 225); doc.line(margin, cursorY, pageWidth - margin, cursorY); cursorY += 5; continue;
        }
        if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; cursorY += 2; continue; }
        if (inCodeBlock) { addText(line.replace(/^ /g, ''), { isCode: true, size: 8 }); }
        else if (line.startsWith("# Inbound- Revenue Intelligence Powerhouse")) { addText(line.substring(2), { size: 18, style: 'bold' }); cursorY += 2; }
        else if (line.startsWith('## ')) { cursorY += 6; addText(line.substring(3), { size: 14, style: 'bold' }); cursorY += 2; }
        else if (line.startsWith('### ')) { cursorY += 4; addText(line.substring(4), { size: 12, style: 'bold' }); cursorY += 1; }
        else if (line.startsWith('-   ')) { addText(`• ${line.substring(4)}`, { indent: 5 }); }
        else if (line.trim() === '') { cursorY += 4; }
        else { addText(line, {}); }
    }
    doc.save('Inbound_Revenue_Intelligence_Powerhouse_Documentation.pdf');
  };

  const handleDownloadDoc = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>App Overview</title></head><body>
    <h1 style="text-align: center; color: #4F46E5;">Inbound- Revenue Intelligence Powerhouse - Overview</h1>
    <p style="font-family: Arial, sans-serif; line-height: 1.6;">${appOverviewDocContent.replace(/\n/g, '<br>')}</p>
    </body></html>`;
    
    const blob = new Blob(['\ufeff', header], {
        type: 'application/msword'
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'App_Overview_Inbound_Revenue_Intelligence_Powerhouse.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-100">Application Documentation</h2>
          <div className="flex items-center gap-2">
             <button onClick={handleDownloadDoc} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300">
                <DocumentIcon className="w-5 h-5" /> <span>Overview (.doc)</span>
            </button>
             <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300">
                <DownloadIcon className="w-5 h-5" /> <span>Full Docs (.pdf)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors ml-2"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="p-6 overflow-y-auto font-sans text-slate-300 text-sm flex-grow bg-slate-900/30">
            <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                    <code>{documentationContent}</code>
                </pre>
                <div className="mt-8 pt-8 border-t border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">App Overview Summary (200 Words)</h2>
                    <p className="italic leading-relaxed">
                        {appOverviewDocContent}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
