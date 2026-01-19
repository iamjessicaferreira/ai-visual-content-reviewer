'use client';

import { AnalysisResult, AnalysisMode } from '@/types/analysis';
import { useState } from 'react';
import StaggeredCard from './StaggeredCard';
import Tooltip from './Tooltip';
import FeedbackButton, { hasAnyFeedbackForMode } from './FeedbackButton';

interface ResultsPanelProps {
  result: AnalysisResult;
  mode: AnalysisMode;
  onReAnalyze?: () => void;
  isReAnalyzing?: boolean;
}

export default function ResultsPanel({ result, mode, onReAnalyze, isReAnalyzing }: ResultsPanelProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [codePrompt, setCodePrompt] = useState<string | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  
  // Generate a unique ID for this result (for feedback tracking)
  const resultId = result.id || `${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportJSON = () => {
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis-result.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCodePrompt = async () => {
    setGeneratingPrompt(true);
    setPromptError(null);
    setCodePrompt(null);

    try {
      const response = await fetch('/api/generate-code-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisResult: result }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code prompt');
      }

      const data = await response.json();
      setCodePrompt(data.codePrompt);
    } catch (err: any) {
      setPromptError(err.message || 'Failed to generate code prompt');
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <Tooltip content={copiedSection === section ? "Copied!" : "Copy to clipboard"} position="top">
      <button
        onClick={() => copyToClipboard(text, section)}
        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 group"
      >
      {copiedSection === section ? (
        <svg className="w-5 h-5 transition-all duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      </button>
    </Tooltip>
  );

  // Regular Mode - Full UI
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <span className="inline-block w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
            Analysis Results
          </h2>
          <FeedbackButton resultId={resultId} mode={mode} />
          {/* Re-analyze button - only show if there's previous feedback */}
          {onReAnalyze && hasAnyFeedbackForMode(mode) && (
            <Tooltip content="Re-analyze this image using your previous feedback to improve the results" position="bottom">
              <button
                onClick={onReAnalyze}
                disabled={isReAnalyzing}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                  flex items-center gap-2
                  ${
                    isReAnalyzing
                      ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-wait'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isReAnalyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Re-analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-analyze based on feedback
                  </>
                )}
              </button>
            </Tooltip>
          )}
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Tooltip content="Learn more about Generate Prompt" position="bottom">
              <button
                onClick={() => setShowHelpDialog(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center text-white transition-all shadow-md hover:shadow-lg"
              >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              </button>
            </Tooltip>
            <Tooltip content="Generate a code prompt for AI code generators" position="bottom">
              <button
                onClick={generateCodePrompt}
                disabled={generatingPrompt}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
              {generatingPrompt ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Prompt
                </>
              )}
              </button>
            </Tooltip>
          </div>
          <Tooltip content="Export analysis results as JSON file" position="bottom">
            <button
              onClick={exportJSON}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export JSON
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Code Prompt Section */}
      {codePrompt && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Generated Code Prompt</h3>
            <CopyButton text={codePrompt} section="code-prompt" />
          </div>
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg p-5 max-h-96 overflow-y-auto shadow-inner">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
              {codePrompt}
            </pre>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
            Copy this prompt and use it with AI code generators (GitHub Copilot, ChatGPT, Claude, etc.) to implement the design improvements.
          </p>
        </div>
      )}

      {promptError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {promptError}
          </p>
        </div>
      )}

      {/* Help Dialog */}
      {showHelpDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowHelpDialog(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-slate-200 dark:border-slate-700 animate-in zoom-in-95 slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                About Generate Prompt
              </h3>
              <button
                onClick={() => setShowHelpDialog(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-slate-700 dark:text-slate-300 mb-4 font-medium leading-relaxed">
              Click this button to generate a prompt that you can use with AI code generators like GitHub Copilot, ChatGPT, and others to implement the design improvements suggested by our platform.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
              The generated prompt will be based on the suggestions and issues identified in the analysis below, providing specific technical requirements for implementing the improvements.
            </p>
            <button
              onClick={() => setShowHelpDialog(false)}
              className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Description */}
        <StaggeredCard index={0}>
          <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Description</h3>
              <CopyButton text={result.description} section="description" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.description}</p>
          </div>
        </StaggeredCard>

        {/* Message Clarity */}
        <StaggeredCard index={1}>
          <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Message Clarity</h3>
              <CopyButton text={result.clarity} section="clarity" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.clarity}</p>
          </div>
        </StaggeredCard>

        {/* Issues */}
        <StaggeredCard index={2}>
          <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Issues</h3>
              <CopyButton
                text={result.issues.join('\n')}
                section="issues"
              />
            </div>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              {result.issues.length > 0 ? (
                result.issues.map((issue, idx) => (
                  <li key={idx} className="leading-relaxed">{issue}</li>
                ))
              ) : (
                <li className="text-slate-500 dark:text-slate-400">No issues identified.</li>
              )}
            </ul>
          </div>
        </StaggeredCard>

        {/* Suggestions */}
        <StaggeredCard index={3}>
          <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Suggestions</h3>
              <CopyButton
                text={result.suggestions.join('\n')}
                section="suggestions"
              />
            </div>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              {result.suggestions.length > 0 ? (
                result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="leading-relaxed">{suggestion}</li>
                ))
              ) : (
                <li className="text-slate-500 dark:text-slate-400">No suggestions available.</li>
              )}
            </ul>
          </div>
        </StaggeredCard>

        {/* Headlines */}
        <StaggeredCard index={4}>
          <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Headline Variations</h3>
              <CopyButton
                text={result.copy_variations.headlines.join('\n')}
                section="headlines"
              />
            </div>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              {result.copy_variations.headlines.length > 0 ? (
                result.copy_variations.headlines.map((headline, idx) => (
                  <li key={idx} className="leading-relaxed">{headline}</li>
                ))
              ) : (
                <li className="text-slate-500 dark:text-slate-400">No headlines generated.</li>
              )}
            </ul>
          </div>
        </StaggeredCard>

        {/* CTAs */}
        <StaggeredCard index={5}>
          <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">CTA Variations</h3>
              <CopyButton
                text={result.copy_variations.ctas.join('\n')}
                section="ctas"
              />
            </div>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              {result.copy_variations.ctas.length > 0 ? (
                result.copy_variations.ctas.map((cta, idx) => (
                  <li key={idx} className="leading-relaxed">{cta}</li>
                ))
              ) : (
                <li className="text-slate-500 dark:text-slate-400">No CTAs generated.</li>
              )}
            </ul>
          </div>
        </StaggeredCard>
      </div>
    </div>
  );
}
