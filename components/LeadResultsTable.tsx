
import React, { useState } from 'react';
import type { Lead, Contact } from '../types';
import { LinkedInIcon, DownloadIcon, GoogleSheetsIcon, SparklesIcon, ChevronDownIcon } from './Icons';

declare var XLSX: any;

interface LeadResultsTableProps {
  leads: Lead[];
  region: string;
  onFindLookalikes: (seedLead: Lead, index: number) => void;
  isLookalikeLoading: number | null;
}

const isLinkable = (url: string) => url && url !== 'Not found' && url.startsWith('http');

const getScoreColor = (score: number) => {
  if (score > 75) return 'bg-green-600';
  if (score > 50) return 'bg-yellow-600';
  return 'bg-red-600';
};

const DeepDivePanel: React.FC<{ lead: Lead }> = ({ lead }) => (
  <div className="bg-slate-900/50 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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
      <div className="flex flex-wrap gap-1">
        {lead.competitors?.map(comp => <span key={comp} className="bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-bold">{comp}</span>)}
      </div>
    </div>
  </div>
);

const LeadCompanyGroup: React.FC<{
    lead: Lead;
    onFindLookalike: () => void;
    isLookalikeLoading: boolean;
}> = ({ lead, onFindLookalike, isLookalikeLoading }) => {
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
                            <td className="px-4 py-4 text-center" rowSpan={rowSpan}>
                                <span className={`px-2.5 py-1 text-xs font-semibold text-white rounded-full ${getScoreColor(lead.leadScore)}`}>
                                    {lead.leadScore}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap" rowSpan={rowSpan}>
                                {isLinkable(lead.companyLinkedIn) ? (
                                    <a href={lead.companyLinkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 group">
                                    <span>{lead.companyName}</span>
                                    <LinkedInIcon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                    </a>
                                ) : (
                                    <span>{lead.companyName}</span>
                                )}
                            </td>
                            <td className="px-6 py-4" rowSpan={rowSpan}>{lead.category}</td>
                             <td className="px-6 py-4 max-w-sm" rowSpan={rowSpan}>
                                <p className="font-medium text-slate-200">{lead.justification}</p>
                                {lead.outreachSuggestion && (
                                    <div className="mt-2 flex items-start gap-2 text-purple-300">
                                    <SparklesIcon className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p className="text-sm italic">{lead.outreachSuggestion}</p>
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
                           <td className="px-6 py-4" rowSpan={rowSpan}>{lead.email}</td>
                           <td className="px-6 py-4" rowSpan={rowSpan}>{lead.phone}</td>
                           <td className="px-4 py-4 text-center" rowSpan={rowSpan}>
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
                        <DeepDivePanel lead={lead} />
                    </td>
                </tr>
            )}
        </>
    );
};


const LeadResultsTable: React.FC<LeadResultsTableProps> = ({ leads, region, onFindLookalikes, isLookalikeLoading }) => {
  const [copiedNotification, setCopiedNotification] = useState('');

  const getFlattenedLeads = () => leads.flatMap(lead =>
    (lead.contacts && lead.contacts.length > 0 ? lead.contacts : [{ contactName: 'N/A', designation: 'N/A', contactLinkedIn: 'Not found' }]).map(contact => ({
      ...lead,
      contactName: contact.contactName,
      designation: contact.designation,
      contactLinkedIn: contact.contactLinkedIn,
    }))
  );
  
  const generateCSV = (): string => {
    const flattenedLeads = getFlattenedLeads();
    const headers = [
        'Lead Score', 'Company Name', 'Region', 'Category', 'Contact Person', 'Designation', 'Email', 'Phone', 
        'Intel', 'Icebreaker'
    ];
    
    const hasComposedEmail = leads.some(lead => lead.composedEmail);
    if (hasComposedEmail) {
        headers.push('AI Composed Email');
    }

    headers.push('Employee Count', 'Latest Funding', 'Tech Stack', 'Company LinkedIn', 'Contact LinkedIn');

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
            `"${(lead.outreachSuggestion || '').replace(/"/g, '""')}"`
        ];

        if (hasComposedEmail) {
            rowData.push(`"${(lead.composedEmail || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`);
        }
        
        rowData.push(
            `"${(lead.employeeCount || '').replace(/"/g, '""')}"`,
            `"${(lead.latestFunding || '').replace(/"/g, '""')}"`,
            `"${(lead.techStack?.join(', ') || '').replace(/"/g, '""')}"`,
            `"${(lead.companyLinkedIn || '').replace(/"/g, '""')}"`,
            `"${(lead.contactLinkedIn || '').replace(/"/g, '""')}"`
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
    // --- Sheet 1: Leads Data ---
    const flattenedLeads = getFlattenedLeads();
    const hasComposedEmail = leads.some(lead => lead.composedEmail);

    const leadsDataForSheet = flattenedLeads.map(lead => {
        const baseData = {
            'Lead Score': lead.leadScore,
            'Company Name': lead.companyName,
            'Region': region,
            'Category': lead.category,
            'Contact Person': lead.contactName,
            'Designation': lead.designation,
            'Email': lead.email,
            'Phone': lead.phone,
            'Intel': lead.justification,
            'Icebreaker': lead.outreachSuggestion,
        };
        const composedEmailData = hasComposedEmail ? { 'AI Composed Email': lead.composedEmail } : {};
        const remainingData = {
            'Employee Count': lead.employeeCount,
            'Latest Funding': lead.latestFunding,
            'Tech Stack': lead.techStack?.join(', '),
            'Company LinkedIn': lead.companyLinkedIn,
            'Contact LinkedIn': lead.contactLinkedIn,
        };
        return { ...baseData, ...composedEmailData, ...remainingData };
    });
    const leadsWorksheet = XLSX.utils.json_to_sheet(leadsDataForSheet);

    // --- Sheet 2: Latest News ---
    const newsDataForSheet = leads.map(lead => ({
      'Lead Score': lead.leadScore,
      'Company Name': lead.companyName,
      'Latest News about the Company': 
        (lead.latestNews && lead.latestNews.url && lead.latestNews.url !== 'N/A')
        ? { t: 's', v: lead.latestNews.title, l: { Target: lead.latestNews.url, Tooltip: `Click to open article: ${lead.latestNews.title}` } }
        : 'N/A',
      'Latest News Related to India Market':
        (lead.latestIndiaNews && lead.latestIndiaNews.url && lead.latestIndiaNews.url !== 'N/A')
        ? { t: 's', v: lead.latestIndiaNews.title, l: { Target: lead.latestIndiaNews.url, Tooltip: `Click to open article: ${lead.latestIndiaNews.title}` } }
        : 'N/A'
    }));
    const newsWorksheet = XLSX.utils.json_to_sheet(newsDataForSheet);

    // Set column widths for news sheet for better readability
    newsWorksheet['!cols'] = [ { wch: 10 }, { wch: 30 }, { wch: 60 }, { wch: 60 } ];

    // --- Create and Download Workbook ---
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, leadsWorksheet, 'Leads');
    XLSX.utils.book_append_sheet(workbook, newsWorksheet, 'Latest News');
    XLSX.writeFile(workbook, 'leads.xlsx');
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
                />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadResultsTable;