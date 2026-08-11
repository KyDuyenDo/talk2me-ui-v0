/**
 * ScoreGauges — Animated circular progress gauges for Overall, Pronunciation, Fluency scores.
 */

import React, { useEffect, useState } from 'react';

interface GaugeProps {
  label: string;
  score: number; // 0-100
  color: string; // CSS color
  size?: number;
}

const CircularGauge: React.FC<GaugeProps> = ({ label, score, color, size = 80 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 800; // ms

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold text-[#1B1F2E] dark:text-white">
            {animatedScore}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#95A0B4] dark:text-[#64748B]">
        {label}
      </span>
    </div>
  );
};

interface ScoreGaugesProps {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
}

export const ScoreGauges: React.FC<ScoreGaugesProps> = ({
  overallScore,
  pronunciationScore,
  fluencyScore,
}) => {
  const getColor = (score: number) => {
    if (score >= 80) return '#22C55E'; // green
    if (score >= 50) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10">
      <CircularGauge
        label="Overall"
        score={overallScore}
        color={getColor(overallScore)}
        size={88}
      />
      <CircularGauge
        label="Pronunciation"
        score={pronunciationScore}
        color={getColor(pronunciationScore)}
      />
      <CircularGauge
        label="Fluency"
        score={fluencyScore}
        color={getColor(fluencyScore)}
      />
    </div>
  );
};
