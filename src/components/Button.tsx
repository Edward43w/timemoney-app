import React from 'react';
import { cn } from '../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-[0_8px_24px_rgba(214,167,86,0.14)]',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-white/10',
    danger: 'bg-red-500/90 hover:bg-red-500 text-white',
    ghost: 'hover:bg-white/[0.06] text-gray-400 hover:text-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 flex items-center justify-center gap-2 active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};
