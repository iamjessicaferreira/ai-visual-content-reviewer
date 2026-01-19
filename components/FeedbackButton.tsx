'use client';

import { useState, useEffect } from 'react';
import { AnalysisMode } from '@/types/analysis';

interface FeedbackButtonProps {
  resultId: string; // Unique ID for this analysis result
  mode: AnalysisMode;
  onFeedback?: (feedback: 'positive' | 'negative', reason?: string) => void;
}

export default function FeedbackButton({ resultId, mode, onFeedback }: FeedbackButtonProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check if feedback was already submitted for this result
  useEffect(() => {
    try {
      const key = `feedback_${mode}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        const feedbacks = JSON.parse(existing);
        const existingFeedback = feedbacks.find((f: any) => f.resultId === resultId);
        if (existingFeedback) {
          setFeedback(existingFeedback.feedback);
          setIsSubmitted(true);
          if (existingFeedback.reason) {
            setReason(existingFeedback.reason);
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }, [resultId, mode]);

  const handleFeedback = async (type: 'positive' | 'negative') => {
    // Don't allow changes if already submitted
    if (isSubmitted) {
      return;
    }

    setFeedback(type);
    
    if (type === 'negative') {
      setShowReasonInput(true);
    } else {
      setShowReasonInput(false);
      await submitFeedback(type, undefined);
    }
  };

  const submitFeedback = async (type: 'positive' | 'negative', reasonText?: string) => {
    setIsSubmitting(true);
    
    // Save to localStorage
    saveFeedback(resultId, type, mode, reasonText);
    
    // Mark as submitted
    setIsSubmitted(true);
    setShowReasonInput(false);
    
    // Call optional callback
    if (onFeedback) {
      onFeedback(type, reasonText);
    }
    
    setIsSubmitting(false);
    
    // Show confirmation message
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 5000); // Hide after 5 seconds
  };

  const handleSubmitReason = async () => {
    if (reason.trim()) {
      await submitFeedback('negative', reason.trim());
      setShowReasonInput(false);
    }
  };

  const handleCancelReason = () => {
    if (isSubmitted) return;
    setShowReasonInput(false);
    setReason('');
    setFeedback(null);
  };

  return (
    <div className="flex items-center gap-2 relative">
      {/* Confirmation message */}
      {showConfirmation && !showReasonInput && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-300 font-medium leading-relaxed">
              Feedback received. AI will generate next prompts for this category based on your feedback.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => handleFeedback('positive')}
        disabled={isSubmitting || isSubmitted}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isSubmitted && feedback !== 'positive' ? 'opacity-50 cursor-not-allowed' : ''}
          ${feedback === 'positive'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
          }
          transform hover:scale-110 active:scale-95 disabled:transform-none
        `}
        title={isSubmitted ? "Feedback already submitted" : "This feedback was helpful"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>

      <button
        onClick={() => handleFeedback('negative')}
        disabled={isSubmitting || isSubmitted}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isSubmitted && feedback !== 'negative' ? 'opacity-50 cursor-not-allowed' : ''}
          ${feedback === 'negative'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
          }
          transform hover:scale-110 active:scale-95 disabled:transform-none
        `}
        title={isSubmitted ? "Feedback already submitted" : "This feedback was not helpful"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>

      {/* Reason input modal */}
      {showReasonInput && !isSubmitted && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-sm">
            What didn't work well?
          </h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please tell us what was inaccurate or unhelpful about this feedback..."
            className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmitReason}
              disabled={!reason.trim() || isSubmitting}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-semibold transition-all duration-200"
            >
              Submit
            </button>
            <button
              onClick={handleCancelReason}
              disabled={isSubmitting}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions to save/load feedback
export function saveFeedback(
  resultId: string,
  feedback: 'positive' | 'negative' | null,
  mode: AnalysisMode,
  reason?: string
) {
  try {
    const key = `feedback_${mode}`;
    const existing = localStorage.getItem(key);
    const feedbacks = existing ? JSON.parse(existing) : [];
    
    if (feedback === null) {
      // Remove feedback
      const filtered = feedbacks.filter((f: any) => f.resultId !== resultId);
      localStorage.setItem(key, JSON.stringify(filtered));
    } else {
      // Add or update feedback
      const existingIndex = feedbacks.findIndex((f: any) => f.resultId === resultId);
      const feedbackData = {
        resultId,
        feedback,
        reason,
        timestamp: Date.now(),
        mode,
      };
      
      if (existingIndex >= 0) {
        feedbacks[existingIndex] = feedbackData;
      } else {
        feedbacks.push(feedbackData);
      }
      
      // Keep only last 50 feedbacks per mode
      const recentFeedbacks = feedbacks.slice(-50);
      localStorage.setItem(key, JSON.stringify(recentFeedbacks));
    }
  } catch (e) {
    console.error('Failed to save feedback:', e);
  }
}

export function getFeedbackForMode(mode: AnalysisMode): Array<{
  resultId: string;
  feedback: 'positive' | 'negative';
  reason?: string;
  timestamp: number;
}> {
  try {
    const key = `feedback_${mode}`;
    const existing = localStorage.getItem(key);
    if (!existing) return [];
    
    const feedbacks = JSON.parse(existing);
    // Return only negative feedbacks with reasons (most useful for improvement)
    return feedbacks.filter((f: any) => f.feedback === 'negative' && f.reason);
  } catch (e) {
    console.error('Failed to load feedback:', e);
    return [];
  }
}

export function hasAnyFeedbackForMode(mode: AnalysisMode): boolean {
  try {
    const key = `feedback_${mode}`;
    const existing = localStorage.getItem(key);
    if (!existing) return false;
    
    const feedbacks = JSON.parse(existing);
    return feedbacks.length > 0;
  } catch (e) {
    return false;
  }
}
