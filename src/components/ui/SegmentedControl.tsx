import type React from 'react';
import { cn } from '../../utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={cn('inline-flex items-center rounded-control bg-canvas-raised p-1 ring-1 ring-line', className)}
  >
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex min-h-8 items-center justify-center gap-2 rounded-detail px-2.5 text-xs font-semibold transition-[color,background-color,box-shadow,transform] duration-200 active:translate-y-px md:px-3',
            selected
              ? 'bg-accent text-accent-ink shadow-accent'
              : 'text-muted hover:bg-surface hover:text-ink',
          )}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      );
    })}
  </div>
);
