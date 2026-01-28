
import React, { useState, useCallback, useEffect } from 'react';
import { generateLeads, findLookalikeLeads, analyzeCompetitor, explainLeadScore, enrichLead } from './services/geminiService';
import type { Lead, StoredSession, CompetitorAnalysis, ScoreExplanation } from './types';
import LeadResultsTable from './components/LeadResultsTable';
import Documentation from './components/Documentation';
import CompetitorAnalysisModal from './components/CompetitorAnalysisModal';
import ScoreExplanationModal from './components/ScoreExplanationModal';
import { SparklesIcon, BookOpenIcon, CheckIcon } from './components/Icons';

const SearchPlatformOptions = [
  { id: 'generalWeb', name: 'Web Search' },
  { id: 'linkedIn', name: 'LinkedIn' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'x_twitter', name: 'X (Twitter)' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'reddit', name: 'Reddit' }
];

const RegionOptions = ['Global', 'APAC', 'UK/Europe', 'USA', 'Canada', 'MENA', 'Africa'];
const DepartmentOptions = [
  'Marketing', 
  'Marketing & Communications', 
  'Global Communications', 
  'International Marketing', 
  'Global Marketing', 
  'PR & Marketing',
  'Global PR',
  'Global PR & Marketing',
  'CEO', 
  'Business Head', 
  'COO'
];
const CategoryOptions = ['Airlines', 'Food', 'Beverages', 'Retail', 'AI & Technology', 'Travel & Tourism', 'Gaming & Betting', 'Education', 'Others'];
const OutreachToneOptions = ['Default (Professional)', 'Formal', 'Casual & Friendly', 'Direct & Concise'];

const SESSION_STORAGE_KEY = 'leadGenSession';

const loadingMessages = [
  "Scraping current 2025 expansion signals...",
  "Cross-referencing LinkedIn recency...",
  "Identifying decision makers in Communications...",
  "Targeting Global Marketing heads...",
  "Building discovery list..."
];

const App: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('AI & Technology');
  const [otherCategory, setOtherCategory] = useState('');
  const [departments, setDepartments] = useState<string[]>(['Marketing', 'Marketing & Communications', 'Global Communications', 'Global PR & Marketing']);
  const [region, setRegion] = useState('Global');
  const [searchPlatforms, setSearchPlatforms] = useState<string[]>(['generalWeb', 'linkedIn', 'reddit']);
  const [includeSimilarCompanies, setIncludeSimilarCompanies] = useState(false);
  const [generateOutreachCadence, setGenerateOutreachCadence] = useState(false);
  const [outreachTone, setOutreachTone] = useState(OutreachToneOptions[0]);
  const [exclusionList, setExclusionList] = useState('');
  const [isAiSaas, setIsAiSaas] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLookalikeLoading, setIsLookalikeLoading] = useState<number | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [showDocs, setShowDocs] = useState(false);

  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [competitorToAnalyze, setCompetitorToAnalyze] = useState<{ name: string; context: Lead } | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [isCompetitorLoading, setIsCompetitorLoading] = useState(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [leadToExplain, setLeadToExplain] = useState<Lead | null>(null);
  const [scoreExplanation, setScoreExplanation] = useState<ScoreExplanation | null>(null);
  const [isScoreExplanationLoading, setIsScoreExplanationLoading] = useState(false);
  const [scoreExplanationError, setScoreExplanationError] = useState<string | null>(null);

  const getFinalCategory = useCallback(() => {
    return category === 'Others' ? otherCategory.trim() : category;
  }, [category, otherCategory]);

  useEffect(() => {
    try {
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
            const parsed = JSON.parse(savedSession) as StoredSession;
            if (parsed && parsed.leads) setLeads(parsed.leads);
            if (parsed && parsed.query) {
                const q = parsed.query;
                setClientName(q.clientName || '');
                setCategory(q.category || 'AI & Technology');
                setDepartments(q.department || ['Marketing', 'Marketing & Communications', 'Global Communications', 'Global PR & Marketing']);
                setRegion(q.region || 'Global');
                setSearchPlatforms(q.searchPlatforms || ['generalWeb', 'linkedIn', 'reddit']);
                setExclusionList(q.exclusionList || '');
                setOutreachTone(q.outreachTone || OutreachToneOptions[0]);
                setIncludeSimilarCompanies(q.includeSimilarCompanies || false);
            }
        }
    } catch (e) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);
  
  useEffect(() => {
    let interval: number;
    if (isLoading) {
      let i = 0;
      interval = window.setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const saveSession = (currentLeads: Lead[]) => {
      const session: StoredSession = {
          leads: currentLeads,
          query: { clientName, category: getFinalCategory(), department: departments, region, searchPlatforms, includeSimilarCompanies, generateOutreachCadence, exclusionList, outreachTone, isAiSaas }
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  const handleGenerateLeads = useCallback(async () => {
    if (departments.length === 0) {
        setError("Please select at least one Target Department.");
        return;
    }
    if (searchPlatforms.length === 0) {
        setError("Please select at least one Search Platform.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setLeads([]);
    const finalCategory = getFinalCategory();
    try {
      const generated = await generateLeads(finalCategory, departments, searchPlatforms, clientName, region, includeSimilarCompanies, generateOutreachCadence, exclusionList, outreachTone, isAiSaas);
      setLeads(generated);
      saveSession(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [getFinalCategory, departments, searchPlatforms, clientName, region, includeSimilarCompanies, generateOutreachCadence, exclusionList, outreachTone, isAiSaas]);

  const handleEnrichLead = async (lead: Lead) => {
    setEnrichingId(lead.companyName);
    setError(null);
    try {
        const enrichment = await enrichLead(lead, outreachTone, departments);
        setLeads(prevLeads => {
            const updated = prevLeads.map(l => l.companyName === lead.companyName ? { ...l, ...enrichment } : l);
            saveSession(updated);
            return [...updated]; 
        });
        setSuccessMessage(`Intel Verified for ${lead.companyName}!`);
        setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
        console.error(err);
        setError(`Research failed for ${lead.companyName}.`);
    } finally {
        setEnrichingId(null);
    }
  };

  const handleBatchEnrich = async (targetCompanyNames?: string[]) => {
    setIsBatchEnriching(true);
    setBatchProgress(0);
    setError(null);
    setSuccessMessage(null);
    
    const leadsToProcess = targetCompanyNames 
        ? leads.filter(l => targetCompanyNames.includes(l.companyName))
        : leads.filter(l => !l.swotAnalysis);

    if (leadsToProcess.length === 0) {
        setIsBatchEnriching(false);
        return;
    }

    let completed = 0;
    let failedCount = 0;

    for (const lead of leadsToProcess) {
        setEnrichingId(lead.companyName);
        try {
            const enrichment = await enrichLead(lead, outreachTone, departments);
            setLeads(prevLeads => {
                const updated = prevLeads.map(l => l.companyName === lead.companyName ? { ...l, ...enrichment } : l);
                saveSession(updated);
                return [...updated];
            });
        } catch (err) {
            console.error(`Failed to research ${lead.companyName}`, err);
            failedCount++;
        }
        completed++;
        setBatchProgress(Math.round((completed / leadsToProcess.length) * 100));
    }
    
    setEnrichingId(null);
    setIsBatchEnriching(false);
    
    if (failedCount < leadsToProcess.length) {
        setSuccessMessage(`Research sequence complete! ${leadsToProcess.length - failedCount} leads verified.`);
        setTimeout(() => setSuccessMessage(null), 5000);
    } else {
        setError("Intel research sequence failed.");
    }
  };

  const handleFindLookalikes = async (seedLead: Lead, index: number) => {
    setIsLookalikeLoading(index);
    try {
        const lookalikes = await findLookalikeLeads(seedLead, region, departments, exclusionList);
        setLeads(prev => {
            const updated = [...prev, ...lookalikes];
            saveSession(updated);
            return updated;
        });
    } catch (err) {
      setError("Lookalike discovery failed.");
    } finally {
        setIsLookalikeLoading(null);
    }
  };

  const handleAnalyzeCompetitor = useCallback(async (competitorName: string, leadContext: Lead) => {
    setCompetitorToAnalyze({ name: competitorName, context: leadContext });
    setIsCompetitorModalOpen(true);
    setIsCompetitorLoading(true);
    setCompetitorAnalysis(null);
    try {
      const analysis = await analyzeCompetitor(competitorName, leadContext, region);
      setCompetitorAnalysis(analysis);
    } catch (err) {
      setCompetitorError("Market analysis failed.");
    } finally {
      setIsCompetitorLoading(false);
    }
  }, [region]);

  const handleExplainScore = useCallback(async (lead: Lead) => {
    setLeadToExplain(lead);
    setIsScoreModalOpen(true);
    setIsScoreExplanationLoading(true);
    try {
        const explanation = await explainLeadScore(lead);
        setScoreExplanation(explanation);
    } catch (err) {
        setScoreExplanationError("Logic breakdown failed.");
    } finally {
        setIsScoreExplanationLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden">
      {/* Notifications */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
          {successMessage && (
            <div className="pointer-events-auto bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-3xl flex items-center gap-4 animate-in slide-in-from-right duration-500 border border-emerald-500/50 backdrop-blur-md">
                <div className="bg-white/20 p-1.5 rounded-full"><CheckIcon className="w-5 h-5" /></div>
                <span className="font-black text-xs uppercase tracking-widest">{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="pointer-events-auto bg-red-600 text-white px-6 py-4 rounded-2xl shadow-3xl flex items-center gap-4 animate-in slide-in-from-right duration-500 border border-red-500/50 backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span className="font-black text-xs uppercase tracking-widest">{error}</span>
            </div>
          )}
      </div>

      {showDocs && <Documentation onClose={() => setShowDocs(false)} />}
      
      {isCompetitorModalOpen && (
        <CompetitorAnalysisModal
          competitorName={competitorToAnalyze?.name || ''}
          isLoading={isCompetitorLoading}
          analysis={competitorAnalysis}
          error={competitorError}
          onClose={() => setIsCompetitorModalOpen(false)}
        />
      )}
      
       {isScoreModalOpen && (
        <ScoreExplanationModal
          lead={leadToExplain}
          isLoading={isScoreExplanationLoading}
          explanation={scoreExplanation}
          error={scoreExplanationError}
          onClose={() => setIsScoreModalOpen(false)}
        />
      )}
      
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-16 relative py-10">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="px-4 py-1.5 bg-purple-900/30 border border-purple-500/30 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">
                Abhishek's Inbound Edition
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                ZEE Revenue Intelligence v2.5
            </div>
          </div>
          <h1 className="text-5xl sm:text-8xl font-black text-white mb-6 tracking-tighter leading-none">
            Inbound- <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-400 drop-shadow-2xl">Revenue Intelligence Powerhouse</span>
          </h1>
          <p className="text-xl text-slate-500 font-bold tracking-tight max-w-3xl mx-auto leading-relaxed">
            Enterprise-grade lead research & strategic sequence orchestration for global market expansion.
          </p>
          <button onClick={() => setShowDocs(true)} className="absolute top-10 right-0 flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all text-[11px] font-black uppercase tracking-widest group">
            <BookOpenIcon className="w-5 h-5 group-hover:-rotate-6 transition-transform" /> <span>System Docs</span>
          </button>
        </header>

        <main className="bg-slate-800/30 backdrop-blur-2xl p-8 sm:p-12 rounded-[3rem] shadow-4xl border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
            <div className="space-y-8">
              <div className="group">
                <label className="block text-[11px] font-black uppercase tracking-widest mb-3 text-slate-500 group-hover:text-purple-400 transition-colors">Target Seed Company (Optional)</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 text-white focus:border-purple-500 transition-all shadow-inner font-bold placeholder:text-slate-700" placeholder="e.g., Derila or RunwayML" />
                <div className="mt-4 flex items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <input 
                    type="checkbox" 
                    id="similarCompanies" 
                    className="w-5 h-5 rounded-lg border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer transition-all" 
                    checked={includeSimilarCompanies} 
                    onChange={(e) => setIncludeSimilarCompanies(e.target.checked)} 
                  />
                  <label htmlFor="similarCompanies" className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-200 transition-colors uppercase tracking-tight">
                    Search for domain competitors & lookalikes
                  </label>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-[11px] font-black uppercase tracking-widest mb-3 text-slate-500 group-hover:text-cyan-400 transition-colors">Negative Search List</label>
                <input 
                  type="text" 
                  value={exclusionList} 
                  onChange={(e) => setExclusionList(e.target.value)} 
                  className="w-full bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 text-white focus:border-cyan-500 transition-all shadow-inner font-bold placeholder:text-slate-700" 
                  placeholder="e.g., Google, Amazon, ZEE (Exclude current clients)" 
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="group">
                <label className="block text-[11px] font-black uppercase tracking-widest mb-3 text-slate-500 group-hover:text-indigo-400 transition-colors">Market Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 text-white focus:border-indigo-500 transition-all font-bold cursor-pointer">
                  {CategoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {category === 'Others' && (
                  <input type="text" value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} className="w-full mt-4 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white focus:border-indigo-500 font-bold" placeholder="Define custom industry niche..." />
                )}
              </div>
              
              <div className="group">
                <label className="block text-[11px] font-black uppercase tracking-widest mb-3 text-slate-500 group-hover:text-emerald-400 transition-colors">HQ Region</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 text-white focus:border-emerald-500 transition-all font-bold cursor-pointer">
                    {RegionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-10 bg-slate-900/40 p-8 rounded-[2rem] border border-slate-700/50 shadow-inner">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-6 text-slate-500 text-center">Target Departments (Multi-Select)</label>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {DepartmentOptions.map(dept => (
                <label key={dept} className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-[10px] font-black cursor-pointer transition-all uppercase tracking-tight ${departments.includes(dept) ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-lg shadow-purple-900/20 scale-105' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}>
                  <input type="checkbox" className="hidden" checked={departments.includes(dept)} onChange={() => setDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])} />
                  {dept}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-10 bg-slate-900/40 p-8 rounded-[2rem] border border-slate-700/50 shadow-inner">
             <div className="w-full">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-6 text-slate-500 text-center">Search Nodes & Social Intelligence</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {SearchPlatformOptions.map(p => (
                      <label key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-[10px] font-black cursor-pointer transition-all uppercase tracking-tight ${searchPlatforms.includes(p.id) ? 'bg-cyan-600/10 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-900/20' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}>
                          <input type="checkbox" className="hidden" checked={searchPlatforms.includes(p.id)} onChange={() => setSearchPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                          <span className="truncate">{p.name}</span>
                      </label>
                  ))}
                </div>
             </div>
          </div>

          <div className="flex justify-center mt-12">
            <button 
                onClick={handleGenerateLeads} 
                disabled={isLoading || !region || departments.length === 0 || searchPlatforms.length === 0} 
                className={`px-14 py-5 font-black rounded-2xl shadow-3xl flex items-center gap-4 transition-all transform hover:scale-105 active:scale-95 uppercase tracking-[0.15em] text-xs ${isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/50'}`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Start Discovery Session</span>
                </>
              )}
            </button>
          </div>
        </main>
        
        {leads.length > 0 && (
          <LeadResultsTable 
            leads={leads} 
            region={region} 
            onFindLookalikes={handleFindLookalikes} 
            isLookalikeLoading={isLookalikeLoading}
            onAnalyzeCompetitor={handleAnalyzeCompetitor}
            onExplainScore={handleExplainScore}
            onEnrichLead={handleEnrichLead}
            enrichingId={enrichingId}
            isBatchEnriching={isBatchEnriching}
            batchProgress={batchProgress}
            onBatchEnrich={handleBatchEnrich}
          />
        )}
      </div>
    </div>
  );
};

export default App;
