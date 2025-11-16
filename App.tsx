
import React, { useState, useCallback, useEffect } from 'react';
import { generateLeads, findLookalikeLeads, analyzeCompetitor, explainLeadScore } from './services/geminiService';
import type { Lead, StoredSession, CompetitorAnalysis, ScoreExplanation } from './types';
import LeadResultsTable from './components/LeadResultsTable';
import Documentation from './components/Documentation';
import CompetitorAnalysisModal from './components/CompetitorAnalysisModal';
import ScoreExplanationModal from './components/ScoreExplanationModal';
import { SparklesIcon, BookOpenIcon } from './components/Icons';

const SearchPlatformOptions = [
  { id: 'generalWeb', name: 'In-depth Web Search' },
  { id: 'linkedIn', name: 'LinkedIn' },
  { id: 'socialMedia', name: 'Social Media Search (FB, X, Instagram)' }
];

const RegionOptions = ['Global', 'APAC', 'UK/Europe', 'USA', 'Canada', 'MENA', 'Africa'];
const DepartmentOptions = ['Marketing', 'International Marketing', 'Sales', 'CEO', 'Business Head', 'COO'];
const CategoryOptions = ['Food', 'Retail', 'Technology', 'Travel & Tourism', 'Gaming & Betting'];
const OutreachToneOptions = ['Default (Professional)', 'Formal', 'Casual & Friendly', 'Direct & Concise'];

const SESSION_STORAGE_KEY = 'leadGenSession';

const loadingMessages = [
  "Scanning web for expansion signals...",
  "Analyzing company data and SWOT...",
  "Cross-referencing LinkedIn profiles...",
  "Identifying key decision-makers...",
  "Generating multi-step outreach cadence...",
  "Compiling deep-dive analysis...",
  "Scoring lead potential...",
  "Finalizing results..."
];

const App: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState(CategoryOptions[0]);
  const [department, setDepartment] = useState(DepartmentOptions[0]);
  const [region, setRegion] = useState(RegionOptions[0]);
  const [searchPlatforms, setSearchPlatforms] = useState<string[]>(['generalWeb', 'linkedIn']);
  const [includeSimilarCompanies, setIncludeSimilarCompanies] = useState(false);
  const [generateOutreachCadence, setGenerateOutreachCadence] = useState(false);
  const [outreachTone, setOutreachTone] = useState(OutreachToneOptions[0]);
  const [exclusionList, setExclusionList] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLookalikeLoading, setIsLookalikeLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [showDocs, setShowDocs] = useState(false);

  // State for Competitor Analysis Modal
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [competitorToAnalyze, setCompetitorToAnalyze] = useState<{ name: string; context: Lead } | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [isCompetitorLoading, setIsCompetitorLoading] = useState(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);

  // State for Score Explanation Modal
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [leadToExplain, setLeadToExplain] = useState<Lead | null>(null);
  const [scoreExplanation, setScoreExplanation] = useState<ScoreExplanation | null>(null);
  const [isScoreExplanationLoading, setIsScoreExplanationLoading] = useState(false);
  const [scoreExplanationError, setScoreExplanationError] = useState<string | null>(null);

  useEffect(() => {
    try {
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
            const { leads: savedLeads, query } = JSON.parse(savedSession) as StoredSession;
            setLeads(savedLeads);
            setClientName(query.clientName);
            setCategory(query.category);
            setDepartment(query.department);
            setRegion(query.region);
            setSearchPlatforms(query.searchPlatforms);
            setIncludeSimilarCompanies(query.includeSimilarCompanies || false);
            setGenerateOutreachCadence(query.generateOutreachCadence || false);
            setOutreachTone(query.outreachTone || OutreachToneOptions[0]);
            setExclusionList(query.exclusionList || '');
        }
    } catch (e) {
        console.error("Failed to load saved session", e);
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
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const saveSession = (currentLeads: Lead[]) => {
      const session: StoredSession = {
          leads: currentLeads,
          query: { clientName, category, department, region, searchPlatforms, includeSimilarCompanies, generateOutreachCadence, exclusionList, outreachTone }
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  const handleClearSession = () => {
      setLeads([]);
      setClientName('');
      setCategory(CategoryOptions[0]);
      setDepartment(DepartmentOptions[0]);
      setRegion(RegionOptions[0]);
      setSearchPlatforms(['generalWeb', 'linkedIn']);
      setIncludeSimilarCompanies(false);
      setGenerateOutreachCadence(false);
      setOutreachTone(OutreachToneOptions[0]);
      setExclusionList('');
      setError(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  const handleGenerateLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLeads([]);

    if ((!category.trim() && !clientName.trim()) || searchPlatforms.length === 0) {
      setError("Please provide a client name or category, and select at least one search platform.");
      setIsLoading(false);
      return;
    }

    try {
      const generated = await generateLeads(category, department, searchPlatforms, clientName, region, includeSimilarCompanies, generateOutreachCadence, exclusionList, outreachTone);
      setLeads(generated);
      saveSession(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [category, department, searchPlatforms, clientName, region, includeSimilarCompanies, generateOutreachCadence, exclusionList, outreachTone]);

  const handleFindLookalikes = useCallback(async (seedLead: Lead, index: number) => {
    setIsLookalikeLoading(index);
    setError(null);
    try {
        const lookalikes = await findLookalikeLeads(seedLead, region, department, exclusionList);
        const updatedLeads = [...leads, ...lookalikes];
        setLeads(updatedLeads);
        saveSession(updatedLeads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while finding similar leads.');
    } finally {
        setIsLookalikeLoading(null);
    }
  }, [leads, region, department, exclusionList]);

  const handleAnalyzeCompetitor = useCallback(async (competitorName: string, leadContext: Lead) => {
    setCompetitorToAnalyze({ name: competitorName, context: leadContext });
    setIsCompetitorModalOpen(true);
    setIsCompetitorLoading(true);
    setCompetitorError(null);
    setCompetitorAnalysis(null);
    try {
      const analysis = await analyzeCompetitor(competitorName, leadContext, region);
      setCompetitorAnalysis(analysis);
    } catch (err) {
      setCompetitorError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsCompetitorLoading(false);
    }
  }, [region]);

  const closeCompetitorModal = () => {
    setIsCompetitorModalOpen(false);
    setCompetitorToAnalyze(null);
    setCompetitorAnalysis(null);
    setCompetitorError(null);
  };

  const handleExplainScore = useCallback(async (lead: Lead) => {
    setLeadToExplain(lead);
    setIsScoreModalOpen(true);
    setIsScoreExplanationLoading(true);
    setScoreExplanationError(null);
    setScoreExplanation(null);
    try {
        const explanation = await explainLeadScore(lead);
        setScoreExplanation(explanation);
    } catch (err) {
        setScoreExplanationError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsScoreExplanationLoading(false);
    }
  }, []);

  const closeScoreModal = () => {
    setIsScoreModalOpen(false);
    setLeadToExplain(null);
    setScoreExplanation(null);
    setScoreExplanationError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {showDocs && <Documentation onClose={() => setShowDocs(false)} />}
      {isCompetitorModalOpen && (
        <CompetitorAnalysisModal
          competitorName={competitorToAnalyze?.name || ''}
          isLoading={isCompetitorLoading}
          analysis={competitorAnalysis}
          error={competitorError}
          onClose={closeCompetitorModal}
        />
      )}
       {isScoreModalOpen && (
        <ScoreExplanationModal
          lead={leadToExplain}
          isLoading={isScoreExplanationLoading}
          explanation={scoreExplanation}
          error={scoreExplanationError}
          onClose={closeScoreModal}
        />
      )}
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-10 relative">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
            Abhishek's Inbound: AI Lead Gen Assistant
          </h1>
          <p className="text-lg text-slate-400">
            Discover untapped international clients showing intent to enter the Indian market.
          </p>
          <button 
            onClick={() => setShowDocs(true)} 
            className="absolute top-0 right-0 flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-semibold"
            title="Open Documentation"
          >
            <BookOpenIcon className="w-5 h-5" />
            <span>Docs</span>
          </button>
        </header>

        <main className="bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="clientName" className="block text-sm font-semibold mb-2 text-slate-300">
                Client Name <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-500"
                placeholder="e.g., Derila"
              />
              {clientName.trim() && (
                <div className="mt-3 flex items-center">
                  <input
                    id="includeSimilar"
                    type="checkbox"
                    checked={includeSimilarCompanies}
                    onChange={(e) => setIncludeSimilarCompanies(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="includeSimilar" className="ml-2 text-sm font-medium text-slate-300">
                    Also find similar companies
                  </label>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-semibold mb-2 text-slate-300">
                Client Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              >
                {CategoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-semibold mb-2 text-slate-300">
                Target Department
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              >
                {DepartmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-6">
              <label htmlFor="exclusionList" className="block text-sm font-semibold mb-2 text-slate-300">
                Exclude Companies <span className="text-slate-400">(Optional, comma-separated)</span>
              </label>
              <textarea
                id="exclusionList"
                value={exclusionList}
                onChange={(e) => setExclusionList(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-slate-500"
                placeholder="e.g., Competitor A, Old Prospect Inc, Known Partner LLC"
                rows={2}
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-slate-300">
                Search Platforms & Options
              </label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-start">
                {SearchPlatformOptions.map(platform => (
                  <div key={platform.id} className="flex items-center">
                    <input
                      id={`platform-${platform.id}`}
                      type="checkbox"
                      checked={searchPlatforms.includes(platform.id)}
                      onChange={(e) => setSearchPlatforms(prev => prev.includes(platform.id) ? prev.filter(p => p !== platform.id) : [...prev, platform.id])}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor={`platform-${platform.id}`} className="ml-2 text-sm font-medium text-slate-300">
                      {platform.name}
                    </label>
                  </div>
                ))}
                <div>
                  <div className="flex items-center">
                      <input
                        id="generateOutreachCadence"
                        type="checkbox"
                        checked={generateOutreachCadence}
                        onChange={(e) => setGenerateOutreachCadence(e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <label htmlFor="generateOutreachCadence" className="ml-2 text-sm font-medium text-slate-300">
                        Generate Outreach Cadence
                      </label>
                  </div>
                  {generateOutreachCadence && (
                      <div className="mt-2 pl-6">
                          <label htmlFor="outreachTone" className="block text-xs font-semibold mb-1 text-slate-400">
                              Cadence Tone
                          </label>
                          <select
                              id="outreachTone"
                              value={outreachTone}
                              onChange={(e) => setOutreachTone(e.target.value)}
                              className="w-full bg-slate-700 border border-slate-600 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                          >
                              {OutreachToneOptions.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-semibold mb-2 text-slate-300">
                Target Region
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              >
                {RegionOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>


          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={handleClearSession}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
                Clear
            </button>
            <button
              onClick={handleGenerateLeads}
              disabled={isLoading || isLookalikeLoading !== null || (!category.trim() && !clientName.trim()) || searchPlatforms.length === 0}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Generate Leads</span>
                </>
              )}
            </button>
          </div>
        </main>
        
        {error && (
          <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {leads.length > 0 && (
          <LeadResultsTable 
            leads={leads} 
            region={region} 
            onFindLookalikes={handleFindLookalikes} 
            isLookalikeLoading={isLookalikeLoading}
            onAnalyzeCompetitor={handleAnalyzeCompetitor}
            onExplainScore={handleExplainScore}
          />
        )}

        {!isLoading && leads.length === 0 && !error && (
            <div className="text-center mt-12 text-slate-500">
                <p>Your generated leads will appear here.</p>
                <p className="text-xs mt-2">Any previous session will be loaded automatically.</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;