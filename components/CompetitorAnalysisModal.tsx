
import React from 'react';
import type { CompetitorAnalysis } from '../types';
import { LinkedInIcon } from './Icons'; // Assuming a generic link icon might be useful

interface CompetitorAnalysisModalProps {
  competitorName: string;
  isLoading: boolean;
  analysis: CompetitorAnalysis | null;
  error: string | null;
  onClose: () => void;
}

const isLinkable = (url: string) => url && url !== 'N/A' && url.startsWith('http');

const CompetitorAnalysisModal: React.FC<CompetitorAnalysisModalProps> = ({ competitorName, isLoading, analysis, error, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">
            Competitor Intel: <span className="text-purple-400">{competitorName}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            title="Close"
            aria-label="Close competitor analysis modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-t-transparent border-purple-400 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-400">Analyzing competitor data...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              <strong className="font-bold">Analysis Failed: </strong>
              <span>{error}</span>
            </div>
          )}
          {analysis && !isLoading && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-400 uppercase text-sm mb-2">AI Analysis</h3>
                <p className="text-slate-200 bg-slate-900/50 p-3 rounded-md">{analysis.analysis}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <h3 className="font-semibold text-slate-400 uppercase text-sm mb-2">Est. Market Share</h3>
                    <p className="text-slate-200 text-lg font-bold">{analysis.marketShare}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-400 uppercase text-sm mb-2">Most Recent News</h3>
                    {isLinkable(analysis.recentNews.url) ? (
                         <a href={analysis.recentNews.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors group">
                            <p>{analysis.recentNews.title}</p>
                            <p className="text-xs text-slate-500 group-hover:text-sky-400 transition-colors truncate">{analysis.recentNews.url}</p>
                        </a>
                    ) : (
                        <p className="text-slate-400 italic">No recent news found.</p>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysisModal;
