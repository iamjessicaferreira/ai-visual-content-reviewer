'use client';

import { useCallback, useState, useEffect } from 'react';
import { validateImageFile } from '@/lib/utils/image';

interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  selectedImage: File | null;
  error?: string;
}

export default function ImageUploader({
  onImageSelect,
  selectedImage,
  error,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync preview with selectedImage prop
  useEffect(() => {
    if (selectedImage) {
      // Always recreate preview when selectedImage changes (new image selected)
      setPreview(null); // Clear old preview first
      setLocalError(null);
      setIsProcessing(true);
      
      // Add timeout to detect if FileReader hangs
      const timeoutId = setTimeout(() => {
        console.error('[ImageUploader] FileReader timeout after 10 seconds');
        setLocalError('Image reading timed out. Please try again or use a different image.');
        setPreview(null);
        setIsProcessing(false);
        onImageSelect(null);
      }, 10000); // 10 second timeout
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        clearTimeout(timeoutId);
        try {
          if (e.target?.result) {
            const result = e.target.result as string;
            // Verify it's actually a valid image data URL
            if (result.startsWith('data:image/')) {
              setPreview(result);
              setLocalError(null);
              setIsProcessing(false);
              console.log('[ImageUploader] Preview created successfully');
            } else {
              throw new Error('Invalid image data format');
            }
          } else {
            throw new Error('No result from FileReader');
          }
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.error('[ImageUploader] Error processing FileReader result:', err);
          setLocalError('Failed to process image. Please try a different image.');
          setPreview(null);
          setIsProcessing(false);
          onImageSelect(null);
        }
      };
      
      reader.onerror = (e) => {
        clearTimeout(timeoutId);
        const error = reader.error || new Error('Unknown FileReader error');
        console.error('[ImageUploader] FileReader error:', error);
        setLocalError(`Failed to read image file: ${error.message || 'Unknown error'}`);
        setPreview(null);
        setIsProcessing(false);
        onImageSelect(null);
      };
      
      reader.onabort = () => {
        clearTimeout(timeoutId);
        console.error('[ImageUploader] FileReader aborted');
        setLocalError('Image reading was cancelled. Please try again.');
        setPreview(null);
        setIsProcessing(false);
        onImageSelect(null);
      };
      
      try {
        reader.readAsDataURL(selectedImage);
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('[ImageUploader] Error starting FileReader:', err);
        setLocalError(`Failed to start reading image: ${err.message || 'Unknown error'}`);
        setPreview(null);
        setIsProcessing(false);
        onImageSelect(null);
      }
    } else {
      // Clear preview when image is cleared
      setPreview(null);
      setLocalError(null);
      setIsProcessing(false);
    }
  }, [selectedImage, onImageSelect]);

  const handleFile = useCallback(
    (file: File) => {
      // Clear previous errors
      setLocalError(null);
      
      // Log file info for debugging
      console.log('[ImageUploader] Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      });
      
      // Basic validation first
      if (!file) {
        const errorMsg = 'No file provided. Please select an image file.';
        console.error('[ImageUploader]', errorMsg);
        setLocalError(errorMsg);
        onImageSelect(null);
        return;
      }

      if (file.size === 0) {
        const errorMsg = 'File is empty. Please select a valid image.';
        console.error('[ImageUploader]', errorMsg);
        setLocalError(errorMsg);
        onImageSelect(null);
        return;
      }

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid image file';
        console.error('[ImageUploader] Validation failed:', errorMsg);
        setLocalError(errorMsg);
        onImageSelect(null); // Clear selection on error
        return;
      }

      // Verify file is actually a File object
      if (!(file instanceof File)) {
        const errorMsg = 'Invalid file object. Please select a valid image file.';
        console.error('[ImageUploader]', errorMsg);
        setLocalError(errorMsg);
        onImageSelect(null);
        return;
      }

      try {
        // Select the file - useEffect will handle creating the preview
        console.log('[ImageUploader] File validated, calling onImageSelect');
        onImageSelect(file);
      } catch (err: any) {
        const errorMsg = `An error occurred while processing the image: ${err.message || 'Unknown error'}`;
        console.error('[ImageUploader] Error in handleFile:', err);
        setLocalError(errorMsg);
        onImageSelect(null);
        setPreview(null);
      }
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      } else {
        setLocalError('No file dropped. Please drop an image file.');
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      console.log('[ImageUploader] File input changed, file:', file ? {
        name: file.name,
        size: file.size,
        type: file.type,
      } : 'none');
      
      if (file) {
        handleFile(file);
        // Only reset input after successful processing (will be reset if error occurs)
        // We'll reset it after a short delay to ensure the file was processed
        setTimeout(() => {
          e.target.value = '';
        }, 100);
      } else {
        const errorMsg = 'No file selected. Please select an image file.';
        console.error('[ImageUploader]', errorMsg);
        setLocalError(errorMsg);
        e.target.value = ''; // Reset on error too
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center 
          flex-1 flex flex-col items-center justify-center
          transition-all duration-300 ease-out
          ${
            isDragging
              ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-xl scale-[1.02] ring-4 ring-blue-200/50 dark:ring-blue-800/50'
              : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-slate-50 dark:hover:from-slate-800/50 hover:to-blue-50/30 dark:hover:to-blue-900/20 hover:shadow-lg'
          }
          ${error ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 animate-shake' : ''}
        `}
      >
        {preview ? (
          <div className="space-y-4 w-full animate-in fade-in zoom-in-95 duration-500">
            <div className="relative group w-full flex items-center justify-center overflow-hidden rounded-xl max-h-64 p-2">
              <img
                src={preview}
                alt="Preview"
                className="max-h-[240px] max-w-full h-auto w-auto rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.01] object-contain"
              />
              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
              {/* Success badge */}
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 z-10">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ready
              </div>
            </div>
            <button
              onClick={() => {
                setPreview(null);
                setLocalError(null);
                onImageSelect(null);
              }}
              className="
                mx-auto flex items-center gap-2 px-4 py-2.5 
                bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
                text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg
                shadow-sm hover:shadow-md
                transform hover:scale-105 active:scale-95
                transition-all duration-300 ease-out
                group
              "
            >
              <svg 
                className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Remove Image</span>
            </button>
          </div>
        ) : (
          <>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing image...</p>
                </div>
              </div>
            )}
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-lg flex items-center gap-2">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Drop image here
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInput}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer block space-y-4 group"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center shadow-inner group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                <svg
                  className="h-10 w-10 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold text-lg transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Click to upload</span>
                  <span className="text-slate-400 dark:text-slate-500">or</span>
                  <span className="font-semibold text-lg transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">drag and drop</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                PNG, JPG, WEBP up to 10MB
              </p>
            </label>
          </>
        )}
      </div>
      {(error || localError) && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error || localError}
          </p>
        </div>
      )}
    </div>
  );
}
