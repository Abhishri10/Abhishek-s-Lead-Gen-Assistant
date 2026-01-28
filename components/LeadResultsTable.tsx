
import React, { useState, useMemo } from 'react';
import type { Lead, Contact } from '../types';
import { LinkedInIcon, GoogleSheetsIcon, SparklesIcon, ChevronDownIcon, SignalIcon, CheckIcon, TargetIcon, LightbulbIcon, DownloadIcon, DocumentIcon } from './Icons';

declare var XLSX: any;
declare var jspdf: any;

interface LeadResultsTableProps {
  leads: Lead[];
  region: string;
  onFindLookalikes: (seedLead: Lead, index: number) => void;
  isLookalikeLoading: number | null;
  onAnalyzeCompetitor: (competitorName: string, leadContext: Lead) => void;
  onExplainScore: (lead: Lead) => void;
  onEnrichLead: (lead: Lead) => void;
  enrichingId: string | null;
  isBatchEnriching: boolean;
  batchProgress: number;
  onBatchEnrich: (targetCompanyNames?: string[]) => void;
}

const getScoreColor = (score: number) => {
  if (score > 75) return 'bg-green-600';
  if (score > 50) return 'bg-yellow-600';
  return 'bg-red-600';
};

const StakeholderRow: React.FC<{ lead: Lead; contact: Contact; region: string; enrichingId: string | null; onEnrichLead: (lead: Lead) => void; onExplainScore: (lead: Lead) => void; isSelected: boolean; onToggle: () => void; }> = ({ lead, contact, region, enrichingId, onEnrichLead, onExplainScore, isSelected, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isEnriching = enrichingId === lead.companyName;

    return (
        <React.Fragment>
            <tr className={`group transition-all duration-300 ${isExpanded ? 'bg-slate-950' : 'hover:bg-slate-800/40'} ${isSelected ? 'bg-cyan-950/20' : ''}`}>
                <td className="px-8 py-10 text-center">
                    <label className="relative flex items-center justify-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isSelected} onChange={onToggle} />
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-700 bg-slate-900 peer-checked:bg-cyan-500 peer-checked:border-cyan-400 transition-all"></div>
                        <CheckIcon className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </label>
                </td>
                <td className="px-4 py-10 text-center">
                    <button onClick={() => onExplainScore(lead)} className={`w-12 h-12 flex items-center justify-center text-xs font-black rounded-xl text-white shadow-lg ${getScoreColor(lead.leadScore)}`}>
                        {lead.leadScore}
                    </button>
                </td>
                <td className="px-8 py-10">
                    <div className="flex flex-col">
                        <span className="font-black text-white text-lg tracking-tight">{contact.contactName}</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{contact.designation}</span>
                    </div>
                </td>
                <td className="px-8 py-10">
                    <div className="flex flex-col">
                        <span className="font-black text-cyan-400 text-sm tracking-tighter">{lead.companyName}</span>
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{lead.category}</span>
                    </div>
                </td>
                <td className="px-8 py-10">
                    <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-400">
                        <span>{contact.email || 'Awaiting ID'}</span>
                        <span>{contact.phone || 'Awaiting ID'}</span>
                    </div>
                </td>
                <td className="px-8 py-10 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <a href={contact.contactLinkedIn} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-500 hover:text-cyan-400 transition-all shadow-md">
                            <LinkedInIcon className="w-5 h-5" />
                        </a>
                        <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2.5 rounded-xl border-2 transition-all ${isExpanded ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={6} className="p-0 border-y border-slate-800 shadow-inner bg-slate-950/50">
                        <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-6">
                                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <SignalIcon className="w-4 h-4" /> Stakeholder Validation
                                    </h4>
                                    <p className="text-slate-300 text-xs italic leading-relaxed">
                                        {contact.roleValidationNote || "Performing deep verification on person's recent public activity..."}
                                    </p>
                                </div>
                                <div className="bg-indigo-950/20 p-6 rounded-3xl border border-indigo-500/20 shadow-xl">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <LinkedInIcon className="w-4 h-4" /> Recent Signal
                                    </h4>
                                    {contact.latestLinkedInPost ? (
                                        <div className="space-y-3">
                                            <p className="text-white font-bold text-xs line-clamp-3">"{contact.latestLinkedInPost.content}"</p>
                                            <a href={contact.latestLinkedInPost.url} target="_blank" className="text-indigo-400 text-[10px] font-black uppercase hover:underline">View Verified Post</a>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 text-[10px] italic font-medium">No verified public post detected for this specific stakeholder.</p>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-widest mb-5 flex items-center gap-3">
                                            <LightbulbIcon className="w-5 h-5" /> Personalized Ice Breaker
                                        </h4>
                                        <p className="text-white text-base font-bold italic leading-relaxed mb-8">
                                            "{contact.outreachSuggestion || 'Researching company expansion patterns to generate a personalized hook...'}"
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        {!contact.isVerified ? (
                                            <button onClick={() => onEnrichLead(lead)} disabled={isEnriching} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all">
                                                {isEnriching ? 'Verifying...' : 'Start Intel Verification'}
                                            </button>
                                        ) : (
                                            <button onClick={() => navigator.clipboard.writeText(contact.outreachSuggestion || '')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all">
                                                Copy Individual Hook
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

const LeadResultsTable: React.FC<LeadResultsTableProps> = ({ 
  leads, region, onAnalyzeCompetitor, onExplainScore, 
  onEnrichLead, enrichingId, isBatchEnriching, batchProgress, onBatchEnrich 
}) => {
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);

  const flatRows = useMemo(() => {
    const rows: { lead: Lead; contact: Contact }[] = [];
    leads.forEach(lead => {
        lead.contacts.forEach(contact => {
            if (!showOnlyVerified || contact.isVerified) {
                rows.push({ lead, contact });
            }
        });
    });
    return rows;
  }, [leads, showOnlyVerified]);

  const toggleSelectContact = (id: string) => {
    setSelectedContactIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const generateExport = (type: 'xlsx' | 'csv') => {
      const activeRows = selectedContactIds.size > 0 
          ? flatRows.filter(r => selectedContactIds.has(`${r.lead.companyName}-${r.contact.contactName}`))
          : flatRows;

      if (activeRows.length === 0) return;

      const wb = XLSX.utils.book_new();
      const exportData = activeRows.map(r => ({
          'Stakeholder Name': r.contact.contactName,
          'Designation': r.contact.designation,
          'Company': r.lead.companyName,
          'Lead Score': r.lead.leadScore,
          'LinkedIn': r.contact.contactLinkedIn,
          'Email': r.contact.email,
          'Phone': r.contact.phone,
          'Verification Note': r.contact.roleValidationNote || 'N/A',
          'Personalized Hook': r.contact.outreachSuggestion || 'N/A',
          'Recent Post': r.contact.latestLinkedInPost?.content || 'N/A'
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Stakeholder Intelligence");
      XLSX.writeFile(wb, `Stakeholder_Intel_${new Date().toISOString().split('T')[0]}.${type}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-20 pb-40 animate-in slide-in-from-bottom-12 duration-1000">
      <div className="flex justify-between items-end mb-10 bg-slate-900/60 p-10 rounded-[3rem] border border-slate-700/50 backdrop-blur-3xl shadow-5xl">
          <div className="space-y-4">
              <h2 className="text-4xl font-black text-white flex items-center gap-5 tracking-tighter">
                <TargetIcon className="w-10 h-10 text-cyan-400" />
                Stakeholder Discovery Hub
              </h2>
              <p className="text-slate-500 font-bold text-sm">Every row is a verified decision-maker. One person, one row.</p>
          </div>
          <div className="flex gap-4">
              <button onClick={() => generateExport('xlsx')} className="flex items-center gap-3 px-8 py-4 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-all font-black text-xs uppercase tracking-widest">
                <DownloadIcon className="w-4 h-4" /> Export Intel ({flatRows.length})
              </button>
              {selectedContactIds.size > 0 && (
                  <button onClick={() => onBatchEnrich()} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                    Verify Selected ({selectedContactIds.size})
                  </button>
              )}
          </div>
      </div>

      <div className="overflow-hidden bg-slate-900/40 rounded-[3rem] border border-slate-700/50 shadow-6xl backdrop-blur-3xl">
        <table className="min-w-full text-left">
          <thead className="bg-slate-950/90 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            <tr>
              <th className="px-8 py-8 w-20 text-center">Select</th>
              <th className="px-4 py-8 w-24 text-center">Score</th>
              <th className="px-8 py-8">Stakeholder Person</th>
              <th className="px-8 py-8">Target Entity</th>
              <th className="px-8 py-8">Contact Information</th>
              <th className="px-8 py-8 text-center w-40">Deep Intel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {flatRows.map((row, idx) => {
                const rowId = `${row.lead.companyName}-${row.contact.contactName}`;
                return (
                    <StakeholderRow 
                        key={idx} 
                        lead={row.lead} 
                        contact={row.contact} 
                        region={region} 
                        enrichingId={enrichingId} 
                        onEnrichLead={onEnrichLead} 
                        onExplainScore={onExplainScore}
                        isSelected={selectedContactIds.has(rowId)}
                        onToggle={() => toggleSelectContact(rowId)}
                    />
                );
            })}
          </tbody>
        </table>
        {flatRows.length === 0 && (
            <div className="p-40 text-center bg-slate-950/50">
                <TargetIcon className="w-20 h-20 text-slate-800 mx-auto mb-6 opacity-30 animate-pulse" />
                <p className="text-slate-600 font-black uppercase tracking-widest">No stakeholders found. Start discovery to populate this hub.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LeadResultsTable;
