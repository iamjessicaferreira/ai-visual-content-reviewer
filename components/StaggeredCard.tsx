'use client';

import { ReactNode } from 'react';

interface StaggeredCardProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export default function StaggeredCard({ children, index, className = '' }: StaggeredCardProps) {
  const delay = index * 100; // 100ms delay between each card

  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-4 ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}
