
import React, { useState, useMemo } from 'react';
import type { Lead } from '../types';
import { LinkedInIcon, GoogleSheetsIcon, SparklesIcon, ChevronDownIcon, SignalIcon, SearchIcon, ClipboardIcon, CheckIcon, TargetIcon, LightbulbIcon, DownloadIcon } from './Icons';

declare var XLSX: any;

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

/**
 * Checks if the lead has undergone 'Deep Intel Research'.
 */
const hasIntel = (lead: Lead) => {
    return !!(
        (lead.swotAnalysis?.strengths && lead.swotAnalysis.strengths.length > 0) ||
        (lead.painPointAnalysis && lead.painPointAnalysis.length > 0)
    );
};

const DeepDivePanel: React.FC<{ lead: Lead; onAnalyzeCompetitor: (competitorName: string, leadContext: Lead) => void; onEnrichLead: (lead: Lead) => void; enrichingId: string | null; }> = ({ lead, onAnalyzeCompetitor, onEnrichLead, enrichingId }) => {
    const verified = hasIntel(lead);
    const isEnriching = enrichingId === lead.companyName;

    if (!verified) {
        return (
            <div className="bg-slate-900/90 p-16 flex flex-col items-center justify-center gap-6 text-center border-b border-slate-700/50 min-h-[350px] animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <TargetIcon className="w-20 h-20 text-slate-800 animate-pulse" />
                    {isEnriching && <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <div className="max-w-md">
                    <h4 className="text-2xl font-black text-slate-200 uppercase tracking-tight">
                        {isEnriching ? 'Synthesizing Verified Intel...' : 'Research Required'}
                    </h4>
                    <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed">
                        {isEnriching 
                            ? 'Scanning LinkedIn profiles and global expansion signals to verify this lead...' 
                            : 'This lead is currently in Discovery status. Perform deep research to move it to your Verified Portfolio.'}
                    </p>
                </div>
                {!isEnriching && (
                    <button onClick={() => onEnrichLead(lead)} className="mt-4 px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs transition-all shadow-2xl shadow-purple-900/50 active:scale-95 uppercase tracking-[0.25em]">
                        Start Intel Research
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-slate-950/80 p-12 grid grid-cols-1 md:grid-cols-4 gap-12 text-xs animate-in slide-in-from-top-6 duration-500 border-x border-slate-800 border-b border-slate-700/50 backdrop-blur-3xl">
            <div className="space-y-8">
                <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-inner">
                    <h4 className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] mb-5">Firmographics</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-800 pb-3">
                            <span className="text-slate-500 font-bold uppercase text-[9px]">Headcount</span>
                            <span className="text-white font-black">{lead.employeeCount || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-3">
                            <span className="text-slate-500 font-bold uppercase text-[9px]">Funding</span>
                            <span className="text-white font-black">{lead.latestFunding || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] mb-4">Verified Tech Stack</h4>
                    <div className="flex flex-wrap gap-2.5">
                        {(lead.techStack || []).length > 0 ? lead.techStack?.map(t => (
                            <span key={t} className="bg-cyan-950/30 text-cyan-400 px-3 py-1.5 rounded-xl border border-cyan-800/30 font-black text-[9px] uppercase tracking-tighter">{t}</span>
                        )) : <span className="text-slate-600 italic">No public tech signals detected</span>}
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-10">
                <div className="bg-green-950/5 p-8 rounded-[3rem] border border-green-900/20">
                    <h4 className="font-black text-green-500 uppercase text-[11px] tracking-[0.2em] flex items-center gap-4 mb-5">
                        <CheckIcon className="w-6 h-6"/> SWOT Intelligence
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-slate-300 font-medium">
                        <div>
                            <span className="text-green-600 text-[9px] font-black uppercase mb-3 block tracking-widest">Strengths</span>
                            <ul className="space-y-2 list-none">
                                {(lead.swotAnalysis?.strengths || []).map((s, i) => <li key={i} className="flex gap-2 text-[11px]"><span className="text-green-500">✓</span> {s}</li>)}
                            </ul>
                        </div>
                        <div>
                            <span className="text-red-600 text-[9px] font-black uppercase mb-3 block tracking-widest">Weaknesses</span>
                            <ul className="space-y-2 list-none">
                                {(lead.swotAnalysis?.weaknesses || []).map((s, i) => <li key={i} className="flex gap-2 text-[11px]"><span className="text-red-500">×</span> {s}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="bg-purple-950/5 p-8 rounded-[3rem] border border-purple-900/20">
                    <h4 className="font-black text-purple-400 uppercase text-[11px] tracking-[0.2em] flex items-center gap-4 mb-5">
                        <LightbulbIcon className="w-6 h-6"/> Pain Points & ZEE Solutions
                    </h4>
                    <div className="space-y-5">
                        {(lead.painPointAnalysis || []).slice(0, 3).map((p, i) => (
                            <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 group hover:border-purple-500/40 transition-all shadow-inner">
                                <p className="font-black text-slate-100 flex items-center gap-3 mb-2 text-[13px]">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.7)]"></span> {p.painPoint}
                                </p>
                                <p className="text-slate-400 pl-5.5 italic leading-relaxed text-[11px] border-l border-slate-800">Recommendation: {p.suggestedSolution}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <h4 className="font-black text-indigo-400 uppercase text-[11px] tracking-[0.2em] mb-2 text-center">Engagement Strategy</h4>
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-8 rounded-[3rem] border border-indigo-500/20 shadow-5xl h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-6 border-b border-indigo-500/10 pb-5">
                            <div className="bg-indigo-500/20 p-3 rounded-2xl">
                               <LinkedInIcon className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">Ground Truth Hook</span>
                        </div>
                        <p className="text-slate-100 italic leading-relaxed font-bold text-sm mb-8">
                            "{lead.outreachSuggestion || 'Identifying expansion signals for high-impact India entry.'}"
                        </p>
                    </div>
                    <button 
                        onClick={() => navigator.clipboard.writeText(lead.outreachSuggestion || '')} 
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-[11px] font-black text-white rounded-[1.5rem] transition-all shadow-3xl active:scale-95 border border-indigo-400/30 uppercase tracking-[0.25em]"
                    >
                        Copy Ice Breaker
                    </button>
                </div>
            </div>
        </div>
    );
};

const LeadResultsTable: React.FC<LeadResultsTableProps> = ({ 
  leads, region, onFindLookalikes, isLookalikeLoading, onAnalyzeCompetitor, onExplainScore, 
  onEnrichLead, enrichingId, isBatchEnriching, batchProgress, onBatchEnrich 
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);

  const filteredLeads = useMemo(() => {
      if (!showOnlyVerified) return leads;
      return leads.filter(l => hasIntel(l));
  }, [leads, showOnlyVerified]);

  const generateIntelligencePortfolio = () => {
      const selectedLeads = leads.filter(l => selectedCompanies.has(l.companyName));
      if (selectedLeads.length === 0) return;

      const wb = XLSX.utils.book_new();

      // Sheet 1: Intelligence Master (12-Column Deep Dive)
      const masterData = selectedLeads.map(l => ({
          'Company Name': l.companyName,
          'Region': region,
          'Industry Vertical': l.category,
          'Decision Maker': l.contacts?.[0]?.contactName || 'Awaiting ID',
          'Designation': l.contacts?.[0]?.designation || 'Key Stakeholder',
          'Business Email': l.email || 'N/A',
          'Business Phone': l.phone || 'N/A',
          'Expansion Rationale': l.justification,
          'Market Entry Signals': (l.marketEntrySignals || []).join('; '),
          'Ice Breaker Hook': l.outreachSuggestion || 'N/A',
          'LinkedIn (Corporate)': l.companyLinkedIn || 'N/A',
          'LinkedIn (Contact)': l.contacts?.[0]?.contactLinkedIn || 'N/A'
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(masterData), "1. Intelligence Master");

      // Sheet 2: SWOT Portfolio
      const swotData = selectedLeads.map(l => ({
          'Company': l.companyName,
          'Strengths': (l.swotAnalysis?.strengths || []).join(' | '),
          'Weaknesses': (l.swotAnalysis?.weaknesses || []).join(' | '),
          'Opportunities': (l.swotAnalysis?.opportunities || []).join(' | '),
          'Threats': (l.swotAnalysis?.threats || []).join(' | ')
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(swotData), "2. SWOT Analysis");

      // Sheet 3: Need-Solution Mapping
      const painData: any[] = [];
      selectedLeads.forEach(l => {
          (l.painPointAnalysis || []).forEach(p => {
              painData.push({ 
                  'Company': l.companyName, 
                  'Identified Need': p.painPoint, 
                  'ZEE Solution Fit': p.suggestedSolution 
              });
          });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(painData), "3. Need-Solution Mapping");

      // Sheet 4: Strategic Signals
      const newsData = selectedLeads.map(l => ({
          'Company': l.companyName,
          'Verified Headcount': l.employeeCount,
          'Recent Funding': l.latestFunding,
          'Critical News Signal': l.latestNews?.title || 'N/A',
          'Signal Source': l.latestNews?.url || 'N/A'
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(newsData), "4. Strategic Signals");

      XLSX.writeFile(wb, `ZEE_Intelligence_Portfolio_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  const toggleSelectLead = (name: string) => {
    setSelectedCompanies(prev => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
    });
  };

  const handleModeAwareAction = () => {
    if (showOnlyVerified) {
        // Step 2: Final selection for the professional portfolio
        generateIntelligencePortfolio();
        setSelectedCompanies(new Set());
    } else {
        // Step 1: Selection for research and verification
        onBatchEnrich(Array.from(selectedCompanies));
        setSelectedCompanies(new Set());
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-20 animate-in slide-in-from-bottom-16 duration-1000 pb-40">
      {/* Workflow Mode Controller */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 bg-slate-900/60 p-12 rounded-[3.5rem] border border-slate-700/50 shadow-5xl backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full -ml-20 -mb-20"></div>

          <div className="flex flex-col gap-4 relative z-10">
              <h2 className="text-5xl font-black text-white flex items-center gap-6 tracking-tighter">
                <SignalIcon className="w-14 h-14 text-cyan-400" />
                {showOnlyVerified ? 'Verified Portfolio' : 'Discovery Hub'}
              </h2>
              <div className="flex items-center gap-10 mt-6">
                  <label className="flex items-center gap-5 cursor-pointer group bg-slate-950/70 px-8 py-5 rounded-3xl border border-slate-800 hover:border-cyan-500/50 transition-all shadow-2xl">
                      <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={showOnlyVerified} 
                            onChange={() => { setShowOnlyVerified(!showOnlyVerified); setSelectedCompanies(new Set()); }} 
                          />
                          <div className="w-16 h-8 bg-slate-800 rounded-full peer peer-checked:bg-cyan-500 transition-colors shadow-inner"></div>
                          <div className="absolute left-1.5 top-1.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-8 shadow-xl"></div>
                      </div>
                      <span className="text-[13px] font-black text-slate-400 group-hover:text-white uppercase tracking-[0.25em] transition-colors">
                        {showOnlyVerified ? 'Back to Discovery Hub' : 'Enter Portfolio View'}
                      </span>
                  </label>
                  {showOnlyVerified && (
                      <div className="flex items-center gap-4 text-emerald-400 font-black text-[11px] uppercase tracking-[0.2em] bg-emerald-950/30 px-6 py-4 rounded-2xl border border-emerald-500/30 shadow-lg animate-pulse">
                          <CheckIcon className="w-6 h-6" /> Export Staging Active
                      </div>
                  )}
              </div>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
              {selectedCompanies.size > 0 && (
                  <button 
                    onClick={handleModeAwareAction} 
                    disabled={isBatchEnriching} 
                    className={`flex items-center gap-5 px-12 py-6 rounded-[2rem] text-sm font-black shadow-4xl transition-all transform hover:scale-105 active:scale-95 group uppercase tracking-[0.25em] ${showOnlyVerified ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/60' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/60'}`}
                  >
                    {showOnlyVerified ? (
                        <><DownloadIcon className="w-7 h-7 group-hover:translate-y-1.5 transition-transform" /> Export 4-Sheet Portfolio ({selectedCompanies.size})</>
                    ) : (
                        <><SparklesIcon className="w-7 h-7 group-hover:rotate-12 transition-transform" /> Verify Intel for Selected ({selectedCompanies.size})</>
                    )}
                  </button>
              )}
          </div>
      </div>

      {isBatchEnriching && (
          <div className="w-full bg-slate-800 h-5 rounded-full mb-16 overflow-hidden border-2 border-slate-700 p-1.5 shadow-2xl relative">
              <div className="bg-gradient-to-r from-purple-600 via-cyan-400 to-indigo-600 h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_35px_rgba(168,85,247,0.6)]" style={{ width: `${batchProgress}%` }}></div>
              <div className="absolute inset-0 bg-white/5 animate-shimmer pointer-events-none"></div>
          </div>
      )}

      {/* Results Hub */}
      <div className="overflow-hidden bg-slate-900/40 rounded-[4rem] shadow-6xl border border-slate-700/50 backdrop-blur-3xl">
        <table className="min-w-full text-sm text-left text-slate-300">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-950/95 border-b border-slate-800 tracking-[0.35em] font-black">
            <tr>
              <th className="px-10 py-10 text-center w-24"><div className="w-6 h-6 rounded-full border-2 border-slate-800 mx-auto"></div></th>
              <th className="px-4 py-10 text-center w-32">Grade</th>
              <th className="px-10 py-10">Entity Name</th>
              <th className="px-10 py-10">Research Rationale</th>
              <th className="px-10 py-10">Key Stakeholder</th>
              <th className="px-8 py-10 text-center w-36">Expand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredLeads.map((lead, index) => {
                const verifiedLead = hasIntel(lead);
                const isEnriching = enrichingId === lead.companyName;
                return (
                    <React.Fragment key={lead.companyName + index}>
                        <tr className={`group transition-all duration-500 ${expandedRow === lead.companyName ? 'bg-slate-950/95' : 'hover:bg-slate-800/50'} ${selectedCompanies.has(lead.companyName) ? 'bg-cyan-950/25' : ''}`}>
                            <td className="px-10 py-12 text-center">
                                <label className="relative flex items-center justify-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={selectedCompanies.has(lead.companyName)} onChange={() => toggleSelectLead(lead.companyName)} />
                                    <div className="w-8 h-8 rounded-xl border-2 border-slate-700 bg-slate-900 transition-all peer-checked:bg-cyan-500 peer-checked:border-cyan-400 shadow-2xl scale-95 group-hover:scale-105"></div>
                                    <CheckIcon className="absolute w-6 h-6 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </label>
                            </td>
                            <td className="px-4 py-12 text-center">
                                <button onClick={() => onExplainScore(lead)} className={`w-16 h-16 flex items-center justify-center text-[16px] font-black rounded-[1.5rem] text-white shadow-5xl transition-all transform hover:scale-110 active:scale-90 ${getScoreColor(lead.leadScore)}`}>
                                    {lead.leadScore}
                                </button>
                            </td>
                            <td className="px-10 py-12">
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-5">
                                        <span className={`font-black text-2xl tracking-tighter transition-colors ${verifiedLead ? 'text-cyan-400' : 'text-slate-100'}`}>{lead.companyName}</span>
                                        {verifiedLead ? (
                                            <span className="bg-cyan-950/60 text-cyan-400 text-[10px] px-4 py-2.5 rounded-full border border-cyan-500/40 font-black tracking-widest uppercase flex items-center gap-2.5 shadow-2xl">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div> Verified
                                            </span>
                                        ) : isEnriching ? (
                                            <span className="bg-purple-950/60 text-purple-400 text-[10px] px-4 py-2.5 rounded-full border border-purple-500/40 font-black animate-pulse uppercase flex items-center gap-2.5">
                                                <div className="w-3 h-3 border-2 border-t-transparent border-purple-400 rounded-full animate-spin"></div> Scouring
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-4 py-2.5 rounded-full border border-slate-800 bg-slate-950/70 text-slate-500 font-black uppercase tracking-[0.2em]">Discovery</span>
                                        )}
                                    </div>
                                    <span className="text-[12px] text-slate-500 font-black tracking-[0.2em] uppercase">{lead.category}</span>
                                </div>
                            </td>
                            <td className="px-10 py-12 max-w-sm">
                                <p className="text-slate-400 italic text-[13px] leading-relaxed line-clamp-2 font-medium">"{lead.justification}"</p>
                            </td>
                            <td className="px-10 py-12">
                                <div className="flex flex-col gap-2.5">
                                    {lead.contacts?.slice(0, 1).map(c => (
                                        <div key={c.contactName} className="flex flex-col">
                                            <span className="text-slate-100 text-[15px] font-black tracking-tight">{c.contactName}</span>
                                            <span className="text-slate-500 text-[11px] uppercase tracking-[0.15em] font-black">{c.designation || 'Key Decision Maker'}</span>
                                        </div>
                                    ))}
                                    {!lead.contacts?.length && <span className="text-slate-600 italic text-[12px] font-black tracking-widest uppercase">Awaiting Verification</span>}
                                </div>
                            </td>
                            <td className="px-8 py-12 text-center">
                                <button onClick={() => setExpandedRow(expandedRow === lead.companyName ? null : lead.companyName)} className={`w-16 h-16 flex items-center justify-center rounded-[1.75rem] transition-all border-2 ${expandedRow === lead.companyName ? 'bg-purple-600 border-purple-500 text-white shadow-5xl shadow-purple-900/60 scale-110' : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white shadow-3xl'}`}>
                                    <ChevronDownIcon className={`w-8 h-8 transition-transform duration-500 ease-out ${expandedRow === lead.companyName ? 'rotate-180' : ''}`} />
                                </button>
                            </td>
                        </tr>
                        {expandedRow === lead.companyName && (
                            <tr><td colSpan={6} className="p-0 border-y border-slate-800 shadow-inner"><DeepDivePanel lead={lead} onAnalyzeCompetitor={onAnalyzeCompetitor} onEnrichLead={onEnrichLead} enrichingId={enrichingId} /></td></tr>
                        )}
                    </React.Fragment>
                );
            })}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
            <div className="p-60 text-center bg-slate-950/40 backdrop-blur-4xl">
                <TargetIcon className="w-32 h-32 text-slate-800 mx-auto mb-10 opacity-40 animate-pulse" />
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-lg">Portfolio Context Empty</p>
                <p className="text-slate-600 text-sm mt-6 font-bold max-w-md mx-auto leading-relaxed">
                   {showOnlyVerified 
                     ? "No leads have been moved to the portfolio. Return to the Discovery Hub, select leads, and verify their intel to move them here."
                     : "Your discovery hub is empty. Use the search form above to find high-intent international targets."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LeadResultsTable;
