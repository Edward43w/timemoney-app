import type React from 'react';
import { cn } from '../../utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
  tone?: 'default' | 'danger' | 'accent';
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
};

const tones = {
  default: 'text-muted hover:bg-surface-raised hover:text-ink',
  danger: 'text-muted hover:bg-negative-muted hover:text-negative',
  accent: 'text-accent hover:bg-accent-muted hover:text-accent-strong',
};

export const IconButton: React.FC<IconButtonProps> = ({
  className,
  size = 'md',
  tone = 'default',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={cn(
      'inline-grid shrink-0 place-items-center rounded-control transition-[color,background-color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
      sizes[size],
      tones[tone],
      className,
    )}
    {...props}
  />
);
