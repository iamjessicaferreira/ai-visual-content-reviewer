'use client';

import { useEffect, useState } from 'react';

interface Step {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface DetailedProgressBarProps {
  loading: boolean;
  currentStep?: number;
}

const steps: Step[] = [
  { label: 'Uploading image', status: 'pending' },
  { label: 'Analyzing with AI', status: 'pending' },
  { label: 'Processing results', status: 'pending' },
  { label: 'Finalizing', status: 'pending' },
];

export default function DetailedProgressBar({ loading, currentStep }: DetailedProgressBarProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setActiveStep(0);
      setProgress(0);
      return;
    }

    // Simulate progress through steps
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000); // Change step every 2 seconds

    // Simulate progress within each step
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  if (!loading) return null;

  const currentSteps = steps.map((step, index) => ({
    ...step,
    status: 
      index < activeStep ? 'completed' as const :
      index === activeStep ? 'active' as const :
      'pending' as const,
  }));

  return (
    <div className="w-full space-y-4 py-4">
      {/* Progress bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.min(progress, 95)}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between items-center text-xs">
        {currentSteps.map((step, index) => (
          <div
            key={index}
            className={`
              flex flex-col items-center gap-1 flex-1
              transition-all duration-300
              ${step.status === 'active' ? 'scale-110' : ''}
            `}
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-300
                ${
                  step.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : step.status === 'active'
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                }
              `}
            >
              {step.status === 'completed' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span
              className={`
                text-center font-medium
                ${
                  step.status === 'active'
                    ? 'text-blue-600 dark:text-blue-400'
                    : step.status === 'completed'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-500 dark:text-slate-400'
                }
              `}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
