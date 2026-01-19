'use client';

import { useEffect } from 'react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  ctrl?: boolean;
  shift?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsProps) {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <details className="group">
        <summary className="cursor-pointer p-3 bg-slate-100 dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-sm font-semibold">Shortcuts</span>
        </summary>
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-sm">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-mono text-xs">
                  {shortcut.ctrl && 'Ctrl + '}
                  {shortcut.shift && 'Shift + '}
                  {shortcut.key.toUpperCase()}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
