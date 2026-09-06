import type React from 'react';
import { cn } from '../../utils';

type SurfaceElement = 'div' | 'section' | 'aside' | 'article';
type SurfaceVariant = 'panel' | 'raised' | 'subtle' | 'outline';

interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: SurfaceElement;
  variant?: SurfaceVariant;
}

const variants: Record<SurfaceVariant, string> = {
  panel: 'bg-surface shadow-panel ring-1 ring-line/70',
  raised: 'bg-surface-raised shadow-panel ring-1 ring-line/60',
  subtle: 'bg-surface-muted',
  outline: 'border border-line bg-transparent',
};

export const Surface: React.FC<SurfaceProps> = ({
  as: Component = 'div',
  variant = 'panel',
  className,
  ...props
}) => (
  <Component
    className={cn('rounded-panel', variants[variant], className)}
    {...props}
  />
);
