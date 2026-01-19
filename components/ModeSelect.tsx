'use client';

import { AnalysisMode } from '@/types/analysis';

interface ModeSelectProps {
  selectedMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
}

const modes: { value: AnalysisMode; label: string; description: string }[] = [
  {
    value: 'marketing',
    label: 'Marketing Feedback',
    description: 'Evaluate messaging, value proposition, and marketing effectiveness',
  },
  {
    value: 'ux',
    label: 'UX / Landing Page Feedback',
    description: 'Analyze user experience, navigation, and interface design',
  },
  {
    value: 'accessibility',
    label: 'Accessibility & Readability',
    description: 'Check contrast, readability, and accessibility compliance',
  },
  {
    value: 'brand',
    label: 'Brand Analysis',
    description: 'Evaluate brand consistency, visual identity, and brand messaging',
  },
  {
    value: 'color-typography',
    label: 'Color & Typography',
    description: 'Analyze color psychology, typography choices, and visual hierarchy',
  },
  {
    value: 'social-media',
    label: 'Social Media Optimization',
    description: 'Optimize for social platforms, engagement, and shareability',
  },
  {
    value: 'conversion',
    label: 'Conversion Optimization',
    description: 'Focus on conversion rates, CTAs, and persuasive design elements',
  },
  {
    value: 'custom',
    label: 'Other (Custom Prompt)',
    description: 'Write your own custom analysis prompt',
  },
];

export default function ModeSelect({
  selectedMode,
  onModeChange,
  customPrompt,
  onCustomPromptChange,
}: ModeSelectProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {modes.map((mode) => (
          <label
            key={mode.value}
            className={`
              flex items-start p-4 border-2 rounded-xl cursor-pointer 
              transition-all duration-300 ease-out
              transform scale-[0.98] hover:scale-100 active:scale-[0.97]
              ${
                selectedMode === mode.value
                  ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg shadow-blue-100/50 dark:shadow-blue-900/50 ring-2 ring-blue-200/50 dark:ring-blue-800/50'
                  : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg hover:bg-gradient-to-r hover:from-slate-50 dark:hover:from-slate-800/50 hover:to-blue-50/30 dark:hover:to-blue-900/20'
              }
            `}
          >
            <input
              type="radio"
              name="analysis-mode"
              value={mode.value}
              checked={selectedMode === mode.value}
              onChange={(e) => onModeChange(e.target.value as AnalysisMode)}
              className="mt-1 mr-3 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">{mode.label}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mode.description}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Custom Prompt Input */}
      {selectedMode === 'custom' && (
        <div className="mt-4 p-5 border-2 border-blue-300 dark:border-blue-600 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Custom Analysis Prompt
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Enter your custom analysis prompt here. For example: 'Analyze this image for color psychology and emotional impact...'"
            className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] text-slate-700 dark:text-slate-300 font-medium transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800"
            rows={4}
          />
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
            Write a detailed prompt describing what you want the AI to analyze. The response will be parsed into structured format (description, clarity, issues, suggestions, headlines, CTAs).
          </p>
        </div>
      )}
    </div>
  );
}
