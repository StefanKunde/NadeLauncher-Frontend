'use client';

import type { TimeWindow } from '@/lib/types';

interface TimeWindowFilterProps {
  value: TimeWindow;
  onChange: (value: TimeWindow) => void;
}

const OPTIONS: { value: TimeWindow; label: string }[] = [
  { value: 'last_30d', label: '30 Days' },
  { value: 'last_90d', label: '90 Days' },
  { value: 'all_time', label: 'All Time' },
];

export default function TimeWindowFilter({ value, onChange }: TimeWindowFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-[#1a1a2e] p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            value === opt.value
              ? 'bg-[#f0a500]/15 text-[#f0a500]'
              : 'text-[#6b6b8a] hover:text-[#e8e8e8]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
