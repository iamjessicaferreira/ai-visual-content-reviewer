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

  // Sync preview with selectedImage prop
  useEffect(() => {
    if (selectedImage) {
      // Always recreate preview when selectedImage changes (new image selected)
      setPreview(null); // Clear old preview first
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreview(e.target.result as string);
          setLocalError(null);
        }
      };
      reader.onerror = () => {
        setLocalError('Failed to read image file');
        setPreview(null);
        onImageSelect(null);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      // Clear preview when image is cleared
      setPreview(null);
      setLocalError(null);
    }
  }, [selectedImage, onImageSelect]);

  const handleFile = useCallback(
    (file: File) => {
      // Clear previous errors
      setLocalError(null);
      
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setLocalError(validation.error || 'Invalid image file');
        onImageSelect(null); // Clear selection on error
        return;
      }

      // Validate file is actually readable
      if (file.size === 0) {
        setLocalError('File is empty. Please select a valid image.');
        onImageSelect(null);
        return;
      }

      try {
        // Select the file - useEffect will handle creating the preview
        onImageSelect(file);
      } catch (err) {
        setLocalError('An error occurred while processing the image');
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
      if (file) {
        handleFile(file);
      } else {
        setLocalError('No file selected. Please select an image file.');
      }
      // Reset input to allow selecting the same file again
      e.target.value = '';
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
