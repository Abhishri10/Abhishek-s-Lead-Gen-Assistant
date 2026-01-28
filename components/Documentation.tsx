
import React from 'react';
import { DownloadIcon, DocumentIcon } from './Icons';

declare var jspdf: any;

const documentationContent = `
# Inbound- Revenue Intelligence Powerhouse: System Documentation & Prompt Guide

## 1. Introduction

Inbound- Revenue Intelligence Powerhouse is an intelligent tool designed to automate and enhance the process of finding international companies that show a strong potential and intent to expand into the Indian market. By leveraging the power of Google's Gemini AI and Google Search, it performs deep-dive analysis on companies, identifies key decision-makers, scores lead quality, and transforms raw data into actionable sales intelligence.

## 2. Core Features & Functionality

-   **Targeted Company Search:** Initiate a search based on a specific company name or a broader industry category.
-   **Lookalike Company Discovery:** For any promising lead, the AI can find other similar companies, expanding your prospect list with highly relevant leads.
-   **Deep-Dive Analysis:** Goes beyond surface-level data to find employee count, latest funding details, tech stack, and SWOT analysis.
-   **Persistent Export Hub:** Access "Download Excel" and "Download CSV" buttons at any time in the Results area. These export the entire current view by default, or just your selected leads.
-   **Multi-Sheet Portfolios:** When in "Portfolio View," the Excel export generates a high-stakes 4-sheet document including SWOT and Pain Point mapping.
-   **Individual PDF Dossiers:** Generate a professional one-page strategic dossier for any "Verified" lead directly from its deep-dive panel.
-   **AI-Powered Lead Scoring:** Each lead is assigned a score from 1-100, providing an at-a-glance metric of its quality.
-   **Personalized Outreach Generation:** Creates a high-impact icebreaker for each lead based on real-time research.
-   **Session Persistence:** Your last search query and results are automatically saved and reloaded when you reopen the app.

## 3. Benefits of Use

-   **Time Savings:** Drastically reduces manual research and data collection hours.
-   **Efficiency:** Focus sales efforts on pre-qualified, high-intent leads.
-   **Actionable Intelligence:** Provides context and justification for every lead.
-   **Improved Conversion:** Start conversations with relevant, data-driven icebreakers.
-   **Data Readiness:** Professional XLSX/CSV exports ready for CRM upload or CEO presentation.

## 4. Usage Guide

1.  **Fill the Search Form:**
    *   **Client Name (Optional):** Enter a specific company for deep research.
    *   **Market Category:** Choose a specific niche (e.g., Food vs. Beverages).
    *   **Target Departments:** Select departments to find relevant stakeholders.
    *   **Target Region:** Specify the geographical HQ location of targets.

2.  **Generate Leads:** Click "Start Discovery Session". The AI will begin multi-node research.

3.  **Review & Export:**
    *   **Discovery Hub:** View initial findings. Use the "Excel" or "CSV" buttons in the Export Hub to save this raw discovery list.
    *   **Verification:** Select interesting leads and click "Verify Intel for Selected" to perform deep scraping.
    *   **Portfolio View:** Toggle to "Portfolio View" to see only verified leads with complete SWOT analysis.
    *   **Strategic Export:** In Portfolio View, the Excel export is upgraded to a strategic dossier format.
    *   **PDF Dossier:** Expand a verified lead and click "Download PDF Dossier" for a single-page company briefing.
`;

const appOverviewDocContent = `
Inbound- Revenue Intelligence Powerhouse is a next-generation sales intelligence platform designed to bridge the gap between global innovations and the Indian market. Built on a modern tech stack comprising React 19, Tailwind CSS, and powered by the cutting-edge Google Gemini 3 model, the app functions as a sophisticated data scraper and researcher.

The platform specializes in identifying high-intent international leads by scanning LinkedIn, Social Media, and global news networks. It detects subtle expansion signals, such as hiring for India-specific roles or community adoption of tools.

Our Unique Selling Proposition (USP) lies in the depth of our automated research. Unlike traditional lead lists, this tool provides full SWOT analyses, verified decision-maker contacts, and pain-point mappings. Furthermore, it automates the creation of professional intelligence portfolios and PDF dossiers. With features like lead scoring, lookalike discovery, and a persistent Export Hub, Inbound empowers sales teams to move beyond cold calling into high-impact, data-driven storytelling and targeted performance funnels.
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
