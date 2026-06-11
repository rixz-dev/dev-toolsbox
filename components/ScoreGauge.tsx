'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ScoreGaugeProps {
  score: number;
  grade: string;
}

export function ScoreGauge({ score, grade }: ScoreGaugeProps) {
  const { color, circumference, radius, strokeDashoffset } = useMemo(() => {
    const r = 52;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    let col = '#00FF88';
    if (score < 40) col = '#FF3B3B';
    else if (score < 70) col = '#FFB800';
    return {
      color: col,
      circumference: c,
      radius: r,
      strokeDashoffset: offset,
    };
  }, [score]);

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-3xl font-bold"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
          }}
        >
          {score}
        </span>
        <span
          className="text-sm font-bold uppercase tracking-wider"
          style={{
            fontFamily: 'var(--font-mono)',
            color,
          }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}
