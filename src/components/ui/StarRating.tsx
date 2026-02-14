'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  count?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ value, onChange, count, size = 'sm' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const isInteractive = !!onChange;
  const displayValue = hoverValue || value;
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            className={isInteractive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => isInteractive && setHoverValue(star)}
            onMouseLeave={() => isInteractive && setHoverValue(0)}
          >
            <Star
              className={`${starSize} ${
                star <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-[#3a3a4e]'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-[#8888aa] ml-0.5">
          ({count})
        </span>
      )}
    </div>
  );
}
