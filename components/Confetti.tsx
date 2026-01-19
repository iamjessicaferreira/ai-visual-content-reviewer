'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger: boolean;
}

export default function Confetti({ trigger }: ConfettiProps) {
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    color: string;
  }>>([]);

  useEffect(() => {
    if (trigger) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500'][
          Math.floor(Math.random() * 5)
        ],
      }));
      setConfetti(particles);

      // Clear confetti after animation
      const timer = setTimeout(() => setConfetti([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (confetti.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-2 h-2 ${particle.color} rounded-full animate-confetti-fall`}
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            top: '-10px',
          }}
        />
      ))}
    </div>
  );
}
