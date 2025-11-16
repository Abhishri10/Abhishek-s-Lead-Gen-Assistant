
import React from 'react';
import type { Lead, ScoreExplanation } from '../types';

interface ScoreExplanationModalProps {
  lead: Lead | null;
  isLoading: boolean;
  explanation: ScoreExplanation | null;
  error: string | null;
  onClose: () => void;
}

const ScoreExplanationModal: React.FC<ScoreExplanationModalProps> = ({ lead, isLoading, explanation, error, onClose }) => {
  if (!lead) return null;

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
            Score Breakdown for <span className="text-purple-400">{lead.companyName}</span> ({lead.leadScore}/100)
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            title="Close"
            aria-label="Close score explanation modal"
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
              <p className="mt-4 text-slate-400">Asking the AI for a breakdown...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              <strong className="font-bold">Analysis Failed: </strong>
              <span>{error}</span>
            </div>
          )}
          {explanation && !isLoading && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-400 uppercase text-sm mb-2">AI Summary</h3>
                <p className="text-slate-200 bg-slate-900/50 p-3 rounded-md italic">"{explanation.explanation}"</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-400 uppercase text-sm mb-2">Key Scoring Factors</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  {explanation.bulletPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreExplanationModal;
