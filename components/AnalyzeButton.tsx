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
      // Simulate smooth progress from 0% to 95% over time
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return prev; // Stop at 95% until loading completes
          }
          // Smooth exponential easing for more natural progress
          const increment = (95 - prev) * 0.15 + Math.random() * 3;
          return Math.min(prev + increment, 95);
        });
      }, 150); // More frequent updates for smoother animation

      return () => clearInterval(interval);
    } else {
      // Smooth reset when loading completes
      setProgress(0);
    }
  }, [loading]);

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          w-full py-4 px-6 rounded-xl font-bold text-white text-lg 
          relative overflow-hidden group
          transition-all duration-300 ease-out
          ${
            disabled
              ? 'bg-slate-400 cursor-not-allowed shadow-sm'
              : loading
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 cursor-wait shadow-lg'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]'
          }
        `}
      >
        {/* Shimmer effect overlay */}
        {loading && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3 h-full animate-shimmer"></div>
          </div>
        )}

        {/* Progress bar background */}
        {loading && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 transition-all duration-300 ease-out"
            style={{ 
              clipPath: `inset(0 ${100 - progress}% 0 0)`,
              transition: 'clip-path 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        )}

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-3">
          {loading ? (
            <>
              <div className="relative">
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
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {/* Pulsing dot indicator */}
                <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></span>
              </div>
              <span className="font-semibold tracking-wide">Analyzing...</span>
            </>
          ) : (
            <>
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-semibold tracking-wide">Analyze Image</span>
            </>
          )}
        </span>
      </button>
      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
