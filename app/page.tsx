'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ModeSelect from '@/components/ModeSelect';
import AnalyzeButton from '@/components/AnalyzeButton';
import ResultsPanel from '@/components/ResultsPanel';
import TypingAnimation from '@/components/TypingAnimation';
import SkeletonLoader from '@/components/SkeletonLoader';
import Confetti from '@/components/Confetti';
import ThemeToggle from '@/components/ThemeToggle';
import { ToastContainer, useToast } from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import DetailedProgressBar from '@/components/DetailedProgressBar';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/components/KeyboardShortcuts';
import ResultsPreview from '@/components/ResultsPreview';
import { getFeedbackForMode } from '@/components/FeedbackButton';
import { AnalysisResult, AnalysisMode, AnalysisError } from '@/types/analysis';

const STORAGE_KEY = 'ai-visual-reviewer-recent-analyses';
const MAX_STORED_ANALYSES = 5;

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('marketing');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Enter',
      description: 'Analyze image',
      ctrl: true,
      action: () => {
        if (!loading && selectedImage && !(selectedMode === 'custom' && !customPrompt.trim())) {
          handleAnalyze();
        }
      },
    },
    {
      key: 'Escape',
      description: 'Clear selection',
      action: () => {
        if (!loading) {
          setSelectedImage(null);
          setResult(null);
          setError(null);
        }
      },
    },
  ]);

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      showToast('Please select an image first', 'warning');
      return;
    }

    if (selectedMode === 'custom' && !customPrompt.trim()) {
      setError('Please enter a custom prompt');
      showToast('Please enter a custom prompt', 'warning');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Scroll to top to show loading state
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('mode', selectedMode);
      if (selectedMode === 'custom') {
        formData.append('customPrompt', customPrompt);
      }
      
      // Include feedback context from previous analyses
      try {
        const feedbacks = getFeedbackForMode(selectedMode);
        if (feedbacks.length > 0) {
          const feedbackContext = JSON.stringify(feedbacks.slice(-5)); // Last 5 feedbacks
          formData.append('feedbackContext', feedbackContext);
        }
      } catch (e) {
        // Ignore errors reading feedback
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData: AnalysisError = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data: AnalysisResult = await response.json();
      
      // Show preview first
      setShowPreview(true);
      
      // Trigger confetti celebration
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
      
      // Show success toast
      showToast('Analysis completed successfully!', 'success');
      
      // Store result but don't show it yet (wait for preview acceptance)
      setResult(data);

      // Store in localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const analyses: AnalysisResult[] = stored ? JSON.parse(stored) : [];
        analyses.unshift(data);
        if (analyses.length > MAX_STORED_ANALYSES) {
          analyses.pop();
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
      } catch (e) {
        // Ignore localStorage errors
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while analyzing the image';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPreview = () => {
    setShowPreview(false);
    // Result is already set, just hide preview
  };

  const handleDismissPreview = () => {
    setShowPreview(false);
    setResult(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <ThemeToggle />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <KeyboardShortcutsHelp shortcuts={[
        { key: 'Enter', description: 'Analyze image', ctrl: true, action: () => {} },
        { key: 'Escape', description: 'Clear selection', action: () => {} },
      ]} />
      <Confetti trigger={showConfetti} />
      {showPreview && result && (
        <ResultsPreview 
          result={result} 
          onAccept={handleAcceptPreview}
          onDismiss={handleDismissPreview}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header with gradient */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent min-h-[3.5rem] md:min-h-[4rem] flex items-center justify-center">
            <TypingAnimation 
              text="AI Visual Content Reviewer" 
              speed={80}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
            />
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-300 font-medium mt-4">
            Upload an image and get structured AI feedback on your visual content
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            AI feedback may be imperfect. Use as a starting point for your review.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-500">
          {/* Two Column Layout: Image Upload and Mode Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
            {/* Image Upload - Left Column */}
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Tooltip content="Upload an image file (PNG, JPG, WEBP up to 10MB)" position="right">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </Tooltip>
                Upload Image
              </h2>
              <ImageUploader
                onImageSelect={setSelectedImage}
                selectedImage={selectedImage}
                error={error && !loading ? error : undefined}
              />
            </div>

            {/* Mode Selection - Right Column */}
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Tooltip content="Select the type of analysis you want to perform on your image" position="right">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </Tooltip>
                Analysis Mode
              </h2>
              <ModeSelect
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
              />
            </div>
          </div>

          {/* Analyze Button - Full Width Below */}
          <div>
            <Tooltip 
              content={!selectedImage ? "Please upload an image first" : "Press Ctrl+Enter to analyze" }
              position="top"
            >
              <div>
                <AnalyzeButton
                  onClick={handleAnalyze}
                  disabled={!selectedImage || (selectedMode === 'custom' && !customPrompt.trim())}
                  loading={loading}
                  error={error && loading ? undefined : error || undefined}
                />
              </div>
            </Tooltip>
          </div>

          {/* Detailed Progress Bar */}
          {loading && (
            <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
              <DetailedProgressBar loading={loading} />
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !result && (
            <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
              <SkeletonLoader />
            </div>
          )}

          {/* Results */}
          {result && !showPreview && (
            <div className="pt-6 border-t border-gray-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ResultsPanel 
                result={result} 
                mode={selectedMode} 
                onReAnalyze={handleAnalyze}
                isReAnalyzing={loading}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
