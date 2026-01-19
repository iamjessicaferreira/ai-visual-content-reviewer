'use client';

export default function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-600 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
              <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
