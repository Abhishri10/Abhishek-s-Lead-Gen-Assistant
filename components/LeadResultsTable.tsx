
import React, { useState } from 'react';
import type { Lead } from '../types';
import { LinkedInIcon, InstagramIcon, DownloadIcon, GoogleSheetsIcon, SparklesIcon, ChevronDownIcon, SignalIcon, SearchIcon, ClipboardIcon, CheckIcon, QuestionMarkCircleIcon, TargetIcon, LightbulbIcon } from './Icons';

declare var XLSX: any;

interface LeadResultsTableProps {
  leads: Lead[];
  region: string;
  onFindLookalikes: (seedLead: Lead, index: number) => void;
  isLookalikeLoading: number | null;
  onAnalyzeCompetitor: (competitorName: string, leadContext: Lead) => void;
  onExplainScore: (lead: Lead) => void;
  onGenerateOutreach: () => void;
  isOutreachLoading: boolean;
}

const isLinkable = (url?: string): url is string => !!url && url !== 'Not found' && url.startsWith('http');

const getScoreColor = (score: number) => {
  if (score > 75) return 'bg-green-600';
  if (score > 50) return 'bg-yellow-600';
  return 'bg-red-600';
};

const OutreachCadencePanel: React.FC<{ lead: Lead }> = ({ lead }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedStates({ ...copiedStates, [index]: true });
        setTimeout(() => setCopiedStates({ ...copiedStates, [index]: false }), 2000);
    };

    if (!lead.outreachCadence || lead.outreachCadence.length === 0) {
        return null;
    }

    return (
        <div className="col-span-2 md:col-span-4">
            <h4 className="font-semibold text-slate-400 uppercase mb-2">AI Outreach Cadence</h4>
            <div className="flex border-b border-slate-700">
                {lead.outreachCadence.map((step, index) => (
                    <button 
                        key={step.step} 
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === index ? 'border-b-2 border-purple-400 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                    >
                        Step {step.step}
                    </button>
                ))}
            </div>
            <div className="p-4 bg-slate-800/50 rounded-b-md">
                <div className="font-semibold text-slate-200 mb-2">Subject: {lead.outreachCadence[activeTab].subject}</div>
                <div className="whitespace-pre-wrap text-slate-300 text-xs relative">
                    {lead.outreachCadence[activeTab].body}
                    <button onClick={() => handleCopy(lead.outreachCadence[activeTab].body, activeTab)} className="absolute top-0 right-0 p-1 text-slate-400 hover:text-white transition-colors" title="Copy Body">
                        {copiedStates[activeTab] ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};


const DeepDivePanel: React.FC<{ lead: Lead; onAnalyzeCompetitor: (competitorName: string, leadContext: Lead) => void; }> = ({ lead, onAnalyzeCompetitor }) => (
  <div className="bg-slate-900/50 p-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
    <div>
      <h4 className="font-semibold text-slate-400 uppercase mb-1">Employee Count</h4>
      <p className="text-slate-200">{lead.employeeCount}</p>
    </div>
    <div>
      <h4 className="font-semibold text-slate-400 uppercase mb-1">Latest Funding</h4>
      <p className="text-slate-200">{lead.latestFunding}</p>
    </div>
    <div>
      <h4 className="font-semibold text-slate-400 uppercase mb-1">Tech Stack</h4>
      <div className="flex flex-wrap gap-1">
        {lead.techStack?.map(tech => <span key={tech} className="bg-sky-800 text-sky-200 px-2 py-0.5 rounded">{tech}</span>)}
      </div>
    </div>
    <div>
      <h4 className="font-semibold text-slate-400 uppercase mb-1">Competitors</h4>
      <div className="flex flex-col gap-1">
        {lead.competitors?.map(comp => (
            <div key={comp} className="flex items-center justify-between bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-bold">
                <span>{comp}</span>
                 <button onClick={() => onAnalyzeCompetitor(comp, lead)} className="p-0.5 hover:bg-indigo-600 rounded-full" title={`Analyze ${comp}`}>
                    <SearchIcon className="w-3 h-3"/>
                 </button>
            </div>
        ))}
      </div>
    </div>

    {lead.swotAnalysis && (
        <div className="col-span-2 md:col-span-4 mt-2">
            <h4 className="font-semibold text-slate-400 uppercase mb-2">SWOT Analysis (India Market Entry)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded">
                    <h5 className="font-bold text-green-400 mb-1">Strengths 💪</h5>
                    <ul className="list-disc list-inside space-y-1">{lead.swotAnalysis.strengths.map(s => <li key={s}>{s}</li>)}</ul>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                    <h5 className="font-bold text-yellow-400 mb-1">Weaknesses ⚠️</h5>
                    <ul className="list-disc list-inside space-y-1">{lead.swotAnalysis.weaknesses.map(w => <li key={w}>{w}</li>)}</ul>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                    <h5 className="font-bold text-sky-400 mb-1">Opportunities 🚀</h5>
                    <ul className="list-disc list-inside space-y-1">{lead.swotAnalysis.opportunities.map(o => <li key={o}>{o}</li>)}</ul>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                    <h5 className="font-bold text-red-400 mb-1">Threats 🛡️</h5>
                    <ul className="list-disc list-inside space-y-1">{lead.swotAnalysis.threats.map(t => <li key={t}>{t}</li>)}</ul>
                </div>
            </div>
        </div>
    )}

    {lead.painPointAnalysis && lead.painPointAnalysis.length > 0 && (
      <div className="col-span-2 md:col-span-4 mt-2">
        <h4 className="font-semibold text-slate-400 uppercase mb-2">Potential Pain Points & Solutions</h4>
        <div className="space-y-3">
          {lead.painPointAnalysis.map((item, index) => (
            <div key={index} className="bg-slate-800/50 p-3 rounded">
              <div className="flex items-start gap-3 mb-2">
                <TargetIcon className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <h5 className="font-bold text-red-400">Pain Point</h5>
                  <p className="text-slate-300">{item.painPoint}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-slate-700/50 pt-2">
                <LightbulbIcon className="w-5 h-5 shrink-0 text-yellow-400 mt-0.5" />
                <div>
                  <h5 className="font-bold text-yellow-400">Suggested Solution</h5>
                  <p className="text-slate-300">{item.suggestedSolution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    <OutreachCadencePanel lead={lead} />

    {lead.latestInstagramPosts && lead.latestInstagramPosts.length > 0 && (
        <div className="col-span-2 md:col-span-4">
            <h4 className="font-semibold text-slate-400 uppercase mb-2">Latest Instagram Posts</h4>
            <div className="space-y-2">
                {lead.latestInstagramPosts.map((post, index) => (
                    <a key={index} href={post.url} target="_blank" rel="noopener noreferrer" className="block p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-md transition-colors">
                        <p className="text-slate-200 truncate">{post.caption}</p>
                        <p className="text-sky-400 text-xs truncate">{post.url}</p>
                    </a>
                ))}
            </div>
        </div>
    )}
  </div>
);

const LeadCompanyGroup: React.FC<{
    lead: Lead;
    onFindLookalike: () => void;
    isLookalikeLoading: boolean;
    onAnalyzeCompetitor: (competitorName: string, leadContext: Lead) => void;
    onExplainScore: (lead: Lead) => void;
}> = ({ lead, onFindLookalike, isLookalikeLoading, onAnalyzeCompetitor, onExplainScore }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const contactsToShow = (lead.contacts && lead.contacts.length > 0) 
        ? lead.contacts 
        : [{ contactName: 'N/A', designation: 'N/A', contactLinkedIn: 'Not found' }];
    
    const rowSpan = contactsToShow.length;

    return (
        <>
            {contactsToShow.map((contact, contactIndex) => (
                <tr key={`${lead.companyName}-${contact.contactName}-${contactIndex}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors duration-200">
                    {contactIndex === 0 && (
                        <>
                            <td className="px-4 py-4 text-center align-top" rowSpan={rowSpan}>
                                <div className="flex items-center justify-center gap-1">
                                    <span className={`px-2.5 py-1 text-xs font-semibold text-white rounded-full ${getScoreColor(lead.leadScore)}`}>
                                        {lead.leadScore}
                                    </span>
                                    <button onClick={() => onExplainScore(lead)} className="p-0.5 text-slate-400 hover:text-white rounded-full transition-colors" title="Why this score?">
                                        <QuestionMarkCircleIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap align-top" rowSpan={rowSpan}>
                                <div className="flex items-center gap-2">
                                    <span>{lead.companyName}</span>
                                    <div className="flex items-center gap-1.5">
                                        {isLinkable(lead.companyLinkedIn) && (
                                            <a href={lead.companyLinkedIn} target="_blank" rel="noopener noreferrer" className="group" title="LinkedIn Profile">
                                                <LinkedInIcon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                            </a>
                                        )}
                                        {isLinkable(lead.instagramProfileUrl) && (
                                            <a href={lead.instagramProfileUrl} target="_blank" rel="noopener noreferrer" className="group" title="Instagram Profile">
                                                <InstagramIcon className="w-4 h-4 text-slate-400 group-hover:text-pink-400 transition-colors" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 align-top" rowSpan={rowSpan}>{lead.category}</td>
                             <td className="px-6 py-4 max-w-sm align-top" rowSpan={rowSpan}>
                                <p className="font-medium text-slate-200">{lead.justification}</p>
                                {lead.marketEntrySignals && lead.marketEntrySignals.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {lead.marketEntrySignals.map((signal, i) => (
                                            <li key={i} className="flex items-start gap-2 text-slate-300">
                                                <SignalIcon className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
                                                <span className="text-xs">{signal}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {lead.outreachSuggestion && (
                                    <div className="mt-2 flex items-start gap-2 text-purple-300 border-t border-slate-700 pt-2">
                                    <SparklesIcon className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p className="text-sm italic">{`Icebreaker: "${lead.outreachSuggestion}"`}</p>
                                    </div>
                                )}
                            </td>
                        </>
                    )}
                    <td className="px-6 py-4">
                        {isLinkable(contact.contactLinkedIn) ? (
                            <a href={contact.contactLinkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 group">
                            <span>{contact.contactName}</span>
                            <LinkedInIcon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            </a>
                        ) : (
                            <span>{contact.contactName}</span>
                        )}
                    </td>
                    <td className="px-6 py-4">{contact.designation}</td>
                    {contactIndex === 0 && (
                        <>
                           <td className="px-6 py-4 align-top" rowSpan={rowSpan}>{lead.email}</td>
                           <td className="px-6 py-4 align-top" rowSpan={rowSpan}>{lead.phone}</td>
                           <td className="px-4 py-4 text-center align-top" rowSpan={rowSpan}>
                             <div className="flex flex-col items-center gap-2">
                                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-slate-400 hover:text-white transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}} title="Toggle Details">
                                    <ChevronDownIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={onFindLookalike} disabled={isLookalikeLoading} className="p-1 text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait" title="Find Similar Companies">
                                    {isLookalikeLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-purple-400 rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
                                </button>
                             </div>
                           </td>
                        </>
                    )}
                </tr>
            ))}
            {isExpanded && (
                <tr className="border-b border-slate-600 bg-slate-800">
                    <td colSpan={9}>
                        <DeepDivePanel lead={lead} onAnalyzeCompetitor={onAnalyzeCompetitor} />
                    </td>
                </tr>
            )}
        </>
    );
};


const LeadResultsTable: React.FC<LeadResultsTableProps> = ({ leads, region, onFindLookalikes, isLookalikeLoading, onAnalyzeCompetitor, onExplainScore, onGenerateOutreach, isOutreachLoading }) => {
  const [copiedNotification, setCopiedNotification] = useState('');

  const getFlattenedLeads = () => leads.flatMap(lead =>
    (lead.contacts && lead.contacts.length > 0 ? lead.contacts : [{ contactName: 'N/A', designation: 'N/A', contactLinkedIn: 'Not found' }]).map(contact => ({
      ...lead,
      contactName: contact.contactName,
      designation: contact.designation,
      contactLinkedIn: contact.contactLinkedIn,
    }))
  );
  
  // Check if we should show the prominent "Generate Outreach" CTA
  const showGenerateOutreachButton = leads.length > 0 && leads.some(lead => !lead.outreachCadence || lead.outreachCadence.length === 0);

  const generateCSV = (): string => {
    const flattenedLeads = getFlattenedLeads();
    const headers = [
        'Lead Score', 'Company Name', 'Region', 'Category', 'Contact Person', 'Designation', 'Email', 'Phone', 
        'Intel Summary', 'Market Entry Signals', 'Icebreaker'
    ];
    
    const hasOutreachCadence = leads.some(lead => lead.outreachCadence && lead.outreachCadence.length > 0);
    if (hasOutreachCadence) {
        headers.push('AI Cadence Step 1 Subject', 'AI Cadence Step 1 Body', 'AI Cadence Step 2 Subject', 'AI Cadence Step 2 Body');
    }

    headers.push('Employee Count', 'Latest Funding', 'Tech Stack', 'Company LinkedIn', 'Contact LinkedIn', 'Instagram Profile');

    const rows = flattenedLeads.map(lead => {
        const rowData = [
            `"${lead.leadScore || ''}"`,
            `"${(lead.companyName || '').replace(/"/g, '""')}"`,
            `"${(region || '').replace(/"/g, '""')}"`,
            `"${(lead.category || '').replace(/"/g, '""')}"`,
            `"${(lead.contactName || '').replace(/"/g, '""')}"`,
            `"${(lead.designation || '').replace(/"/g, '""')}"`,
            `"${(lead.email || '').replace(/"/g, '""')}"`,
            `"${(lead.phone || '').replace(/"/g, '""')}"`,
            `"${(lead.justification || '').replace(/"/g, '""')}"`,
            `"${(lead.marketEntrySignals?.join('; ') || '').replace(/"/g, '""')}"`,
            `"${(lead.outreachSuggestion || '').replace(/"/g, '""')}"`
        ];

        if (hasOutreachCadence) {
            const step1 = lead.outreachCadence?.[0];
            const step2 = lead.outreachCadence?.[1];
            rowData.push(
                `"${(step1?.subject || '').replace(/"/g, '""')}"`,
                `"${(step1?.body || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`,
                `"${(step2?.subject || '').replace(/"/g, '""')}"`,
                `"${(step2?.body || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`,
            );
        }
        
        rowData.push(
            `"${(lead.employeeCount || '').replace(/"/g, '""')}"`,
            `"${(lead.latestFunding || '').replace(/"/g, '""')}"`,
            `"${(lead.techStack?.join(', ') || '').replace(/"/g, '""')}"`,
            `"${(lead.companyLinkedIn || '').replace(/"/g, '""')}"`,
            `"${(lead.contactLinkedIn || '').replace(/"/g, '""')}"`,
            `"${(lead.instagramProfileUrl || '').replace(/"/g, '""')}"`
        );

        return rowData.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const downloadFile = (content: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(content);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'leads.csv');
  };

  const downloadXLSX = () => {
    const workbook = XLSX.utils.book_new();

    // --- Sheet 1: Leads Data ---
    const flattenedLeads = getFlattenedLeads();
    const leadsDataForSheet = flattenedLeads.map(lead => ({
        'Lead Score': lead.leadScore,
        'Company Name': lead.companyName,
        'Region': region,
        'Category': lead.category,
        'Contact Person': lead.contactName,
        'Designation': lead.designation,
        'Email': lead.email,
        'Phone': lead.phone,
        'Intel Summary': lead.justification,
        'Market Entry Signals': lead.marketEntrySignals?.join('\n'),
        'Icebreaker': lead.outreachSuggestion,
        'Employee Count': lead.employeeCount,
        'Latest Funding': lead.latestFunding,
        'Tech Stack': lead.techStack?.join(', '),
        'Company LinkedIn': isLinkable(lead.companyLinkedIn) ? { t: 's', v: 'Link', l: { Target: lead.companyLinkedIn, Tooltip: lead.companyLinkedIn } } : 'N/A',
        'Contact LinkedIn': isLinkable(lead.contactLinkedIn) ? { t: 's', v: 'Link', l: { Target: lead.contactLinkedIn, Tooltip: lead.contactLinkedIn } } : 'Not found',
        'Instagram Profile': isLinkable(lead.instagramProfileUrl) ? { t: 's', v: 'Link', l: { Target: lead.instagramProfileUrl, Tooltip: lead.instagramProfileUrl } } : 'N/A',
    }));
    const leadsWorksheet = XLSX.utils.json_to_sheet(leadsDataForSheet);
    XLSX.utils.book_append_sheet(workbook, leadsWorksheet, 'Leads');

    // --- Sheet 2: SWOT Analysis ---
    const swotDataForSheet = leads.map(lead => ({
        'Company Name': lead.companyName,
        'Strengths': lead.swotAnalysis?.strengths?.join('\n'),
        'Weaknesses': lead.swotAnalysis?.weaknesses?.join('\n'),
        'Opportunities': lead.swotAnalysis?.opportunities?.join('\n'),
        'Threats': lead.swotAnalysis?.threats?.join('\n'),
    }));
    const swotWorksheet = XLSX.utils.json_to_sheet(swotDataForSheet);
    swotWorksheet['!cols'] = [ { wch: 30 }, { wch: 50 }, { wch: 50 }, { wch: 50 }, { wch: 50 } ];
    XLSX.utils.book_append_sheet(workbook, swotWorksheet, 'SWOT Analysis');

    // --- Sheet 3: Pain Point Analysis ---
    if (leads.some(l => l.painPointAnalysis && l.painPointAnalysis.length > 0)) {
        const painPointDataForSheet = leads.flatMap(lead => 
            lead.painPointAnalysis?.map(item => ({
                'Company Name': lead.companyName,
                'Pain Point': item.painPoint,
                'Suggested Solution': item.suggestedSolution,
            })) || []
        );
        const painPointWorksheet = XLSX.utils.json_to_sheet(painPointDataForSheet);
        painPointWorksheet['!cols'] = [ { wch: 30 }, { wch: 60 }, { wch: 60 } ];
        XLSX.utils.book_append_sheet(workbook, painPointWorksheet, 'Pain Point Analysis');
    }

    // --- Sheet 4: Outreach Cadence ---
    if (leads.some(l => l.outreachCadence && l.outreachCadence.length > 0)) {
        const cadenceDataForSheet = leads.flatMap(lead => 
            lead.outreachCadence?.map(step => ({
                'Company Name': lead.companyName,
                'Step': step.step,
                'Subject': step.subject,
                'Body': step.body,
            })) || []
        );
        const cadenceWorksheet = XLSX.utils.json_to_sheet(cadenceDataForSheet);
        cadenceWorksheet['!cols'] = [ { wch: 30 }, { wch: 5 }, { wch: 40 }, { wch: 80 } ];
        XLSX.utils.book_append_sheet(workbook, cadenceWorksheet, 'Outreach Cadence');
    }

    // --- Sheet 5: Latest News ---
    const newsDataForSheet = leads.map(lead => ({
      'Company Name': lead.companyName,
      'Latest News': (lead.latestNews && isLinkable(lead.latestNews.url)) ? { t: 's', v: lead.latestNews.title, l: { Target: lead.latestNews.url, Tooltip: `Click to open article` } } : 'N/A',
      'India-Related News': (lead.latestIndiaNews && isLinkable(lead.latestIndiaNews.url)) ? { t: 's', v: lead.latestIndiaNews.title, l: { Target: lead.latestIndiaNews.url, Tooltip: `Click to open article` } } : 'N/A'
    }));
    const newsWorksheet = XLSX.utils.json_to_sheet(newsDataForSheet);
    newsWorksheet['!cols'] = [ { wch: 30 }, { wch: 60 }, { wch: 60 } ];
    XLSX.utils.book_append_sheet(workbook, newsWorksheet, 'Latest News');

    // --- Sheet 6: Instagram Posts ---
    const instaDataForSheet = leads.flatMap(lead => 
        (lead.latestInstagramPosts && lead.latestInstagramPosts.length > 0) 
        ? lead.latestInstagramPosts.map(post => ({
            'Company Name': lead.companyName, 'Post Caption': post.caption, 'Post URL': { t: 's', v: post.url, l: { Target: post.url, Tooltip: `Click to open post` } }
        })) 
        : [{ 'Company Name': lead.companyName, 'Post Caption': 'N/A', 'Post URL': { t: 's', v: 'N/A' } }]
    );
    const instaWorksheet = XLSX.utils.json_to_sheet(instaDataForSheet);
    instaWorksheet['!cols'] = [ { wch: 30 }, { wch: 60 }, { wch: 60 } ];
    XLSX.utils.book_append_sheet(workbook, instaWorksheet, 'Instagram Posts');

    XLSX.writeFile(workbook, 'leads_intelligence_report.xlsx');
  };
  
  const openInGoogleSheets = () => {
    const csvContent = generateCSV();
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedNotification('Copied! Now paste into your new Google Sheet.');
      window.open('https://docs.google.com/spreadsheets/create', '_blank');
      setTimeout(() => setCopiedNotification(''), 3000);
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Generated Leads</h2>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {showGenerateOutreachButton && (
              <button 
                  onClick={onGenerateOutreach} 
                  disabled={isOutreachLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-wait mr-2"
                  title="Generate email sequences for these leads"
              >
                  {isOutreachLoading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                      <SparklesIcon className="w-5 h-5" />
                  )}
                  <span>Generate Outreach Emails</span>
              </button>
          )}
           <button onClick={downloadCSV} className="flex items-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={leads.length === 0} title="Download .CSV">
            <DownloadIcon className="w-5 h-5" /> <span>.csv</span>
          </button>
          <button onClick={downloadXLSX} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={leads.length === 0} title="Download .xlsx">
            <DownloadIcon className="w-5 h-5" /> <span>.xlsx</span>
          </button>
          <button onClick={openInGoogleSheets} className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={leads.length === 0} title="Open in Google Sheets">
            <GoogleSheetsIcon className="w-5 h-5" /> <span>Google Sheets</span>
          </button>
        </div>
      </div>
      {copiedNotification && (
          <div className="text-center mb-4 text-sm text-green-400">
            <p>{copiedNotification}</p>
          </div>
      )}
      <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-lg">
        <table className="min-w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-200 uppercase bg-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-center">Score</th>
              <th scope="col" className="px-6 py-3">Company Name</th>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3">Intel & Icebreaker</th>
              <th scope="col" className="px-6 py-3">Contact Person</th>
              <th scope="col" className="px-6 py-3">Designation</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Phone</th>
              <th scope="col" className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
                <LeadCompanyGroup 
                    key={`${lead.companyName}-${index}`} 
                    lead={lead}
                    onFindLookalike={() => onFindLookalikes(lead, index)}
                    isLookalikeLoading={isLookalikeLoading === index}
                    onAnalyzeCompetitor={onAnalyzeCompetitor}
                    onExplainScore={onExplainScore}
                />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadResultsTable;
