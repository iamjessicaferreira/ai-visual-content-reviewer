'use client';

import { AnalysisResult } from '@/types/analysis';
import { useState } from 'react';

interface ResultsPreviewProps {
  result: AnalysisResult;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function ResultsPreview({ result, onAccept, onDismiss }: ResultsPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border-2 border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Analysis Complete! 🎉
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Preview your results before viewing the full analysis
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            {/* Description Preview */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Description</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                {result.description}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.issues.length}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Issues Found</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.suggestions.length}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 mt-1">Suggestions</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {result.copy_variations.headlines.length + result.copy_variations.ctas.length}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">Variations</div>
              </div>
            </div>

            {/* Expandable Details */}
            <details className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <summary className="p-4 cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>View More Details</span>
                <svg className="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 space-y-3 text-sm">
                {result.issues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Top Issues:</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {result.issues.slice(0, 3).map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Top Suggestions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {result.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all duration-300"
          >
            Dismiss
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            View Full Results
          </button>
        </div>
      </div>
    </div>
  );
}
