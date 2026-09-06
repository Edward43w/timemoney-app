import React from 'react';
import { cn } from '../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  type = 'button',
  ...props 
}) => {
  const variants = {
    primary: 'bg-accent text-accent-ink shadow-accent hover:bg-accent-strong',
    secondary: 'border border-line bg-surface-raised text-ink-soft hover:border-line-strong hover:bg-surface',
    danger: 'border border-negative/25 bg-negative-muted text-negative hover:bg-negative/20 hover:text-red-200',
    ghost: 'text-muted hover:bg-surface-raised hover:text-ink',
    quiet: 'text-accent hover:bg-accent-muted hover:text-accent-strong',
  };

  const sizes = {
    sm: 'min-h-8 px-3 py-1.5 text-xs',
    md: 'min-h-10 px-4 py-2 text-sm',
    lg: 'min-h-12 px-5 py-2.5 text-sm',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
      type={type}
      {...props}
    />
  );
};
