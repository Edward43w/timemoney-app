import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { PomodoroTimerController } from '../usePomodoroTimer';
import { IconButton } from './ui/IconButton';
import { PomodoroPanel } from './PomodoroPanel';

interface PomodoroModalProps {
  timer: PomodoroTimerController;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
  onTimerStarted?: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  timer,
  onDeleteSession,
  onClose,
  onTimerStarted,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="專注計時器"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-panel shadow-float custom-scrollbar"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <IconButton
          onClick={onClose}
          className="absolute right-3 top-3 z-10 bg-surface-raised/90"
          aria-label="關閉專注計時器"
        >
          <X size={18} />
        </IconButton>
        <PomodoroPanel
          timer={timer}
          onDeleteSession={onDeleteSession}
          onTimerStarted={onTimerStarted}
        />
      </div>
    </div>
  );
};
