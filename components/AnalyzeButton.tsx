'use client';

import { useEffect, useState } from 'react';

interface AnalyzeButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  error?: string;
}

export default function AnalyzeButton({
  onClick,
  disabled,
  loading,
  error,
}: AnalyzeButtonProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      // Simulate progress from 0% to 90% over time
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return prev; // Stop at 90% until loading completes
          }
          // Gradually increase progress
          return Math.min(prev + Math.random() * 15, 90);
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Reset progress when loading completes
      setProgress(0);
    }
  }, [loading]);

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all duration-200 relative overflow-hidden
          ${
            disabled
              ? 'bg-slate-400 cursor-not-allowed shadow-sm'
              : loading
              ? 'bg-slate-400 cursor-not-allowed shadow-sm'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
          }
        `}
      >
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}></div>
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyze Image
            </>
          )}
        </span>
      </button>
      {error && (
        <p className="text-sm font-semibold text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
