'use client';

import { AnalysisResult, AnalysisMode } from '@/types/analysis';
import { useState } from 'react';

interface ResultsPanelProps {
  result: AnalysisResult;
  mode: AnalysisMode;
}

export default function ResultsPanel({ result, mode }: ResultsPanelProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [codePrompt, setCodePrompt] = useState<string | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

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
    <button
      onClick={() => copyToClipboard(text, section)}
      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
      title={copiedSection === section ? "Copied!" : "Copy to clipboard"}
    >
      {copiedSection === section ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );

  // Regular Mode - Full UI
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Analysis Results</h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpDialog(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center text-white transition-all shadow-md hover:shadow-lg"
              title="Learn more about Generate Prompt"
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
            <button
              onClick={generateCodePrompt}
              disabled={generatingPrompt}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {generatingPrompt ? 'Generating...' : 'Generate Prompt'}
            </button>
          </div>
          <button
            onClick={exportJSON}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export JSON
          </button>
        </div>
      </div>

      {/* Code Prompt Section */}
      {codePrompt && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Generated Code Prompt</h3>
            <CopyButton text={codePrompt} section="code-prompt" />
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-lg p-5 max-h-96 overflow-y-auto shadow-inner">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
              {codePrompt}
            </pre>
          </div>
          <p className="mt-4 text-sm text-slate-600 font-medium">
            Copy this prompt and use it with AI code generators (GitHub Copilot, ChatGPT, Claude, etc.) to implement the design improvements.
          </p>
        </div>
      )}

      {promptError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-md">
          <p className="text-sm font-medium text-red-700">{promptError}</p>
        </div>
      )}

      {/* Help Dialog */}
      {showHelpDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
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
            <p className="text-slate-700 mb-4 font-medium leading-relaxed">
              Click this button to generate a prompt that you can use with AI code generators like GitHub Copilot, ChatGPT, and others to implement the design improvements suggested by our platform.
            </p>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              The generated prompt will be based on the suggestions and issues identified in the analysis below, providing specific technical requirements for implementing the improvements.
            </p>
            <button
              onClick={() => setShowHelpDialog(false)}
              className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Description */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">Description</h3>
            <CopyButton text={result.description} section="description" />
          </div>
          <p className="text-slate-700 leading-relaxed">{result.description}</p>
        </div>

        {/* Message Clarity */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">Message Clarity</h3>
            <CopyButton text={result.clarity} section="clarity" />
          </div>
          <p className="text-slate-700 leading-relaxed">{result.clarity}</p>
        </div>

        {/* Issues */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">Issues</h3>
            <CopyButton
              text={result.issues.join('\n')}
              section="issues"
            />
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            {result.issues.length > 0 ? (
              result.issues.map((issue, idx) => (
                <li key={idx} className="leading-relaxed">{issue}</li>
              ))
            ) : (
              <li className="text-slate-500">No issues identified.</li>
            )}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">Suggestions</h3>
            <CopyButton
              text={result.suggestions.join('\n')}
              section="suggestions"
            />
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            {result.suggestions.length > 0 ? (
              result.suggestions.map((suggestion, idx) => (
                <li key={idx} className="leading-relaxed">{suggestion}</li>
              ))
            ) : (
              <li className="text-slate-500">No suggestions available.</li>
            )}
          </ul>
        </div>

        {/* Headlines */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">Headline Variations</h3>
            <CopyButton
              text={result.copy_variations.headlines.join('\n')}
              section="headlines"
            />
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            {result.copy_variations.headlines.length > 0 ? (
              result.copy_variations.headlines.map((headline, idx) => (
                <li key={idx} className="leading-relaxed">{headline}</li>
              ))
            ) : (
              <li className="text-slate-500">No headlines generated.</li>
            )}
          </ul>
        </div>

        {/* CTAs */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">CTA Variations</h3>
            <CopyButton
              text={result.copy_variations.ctas.join('\n')}
              section="ctas"
            />
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            {result.copy_variations.ctas.length > 0 ? (
              result.copy_variations.ctas.map((cta, idx) => (
                <li key={idx} className="leading-relaxed">{cta}</li>
              ))
            ) : (
              <li className="text-slate-500">No CTAs generated.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
