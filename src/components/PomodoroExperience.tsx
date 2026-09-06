import React from 'react';
import { PomodoroSession, Task } from '../types';
import { usePomodoroTimer } from '../usePomodoroTimer';
import { ActivePomodoroBar } from './ActivePomodoroBar';
import { PomodoroModal } from './PomodoroModal';

interface PomodoroExperienceProps {
  isOpen: boolean;
  tasks: Task[];
  sessions: PomodoroSession[];
  storageKey: string;
  onAddSession: (session: PomodoroSession) => void;
  onDeleteSession: (id: string) => void;
  onOpen: () => void;
  onClose: () => void;
}

export const PomodoroExperience: React.FC<PomodoroExperienceProps> = ({
  isOpen,
  tasks,
  sessions,
  storageKey,
  onAddSession,
  onDeleteSession,
  onOpen,
  onClose,
}) => {
  const timer = usePomodoroTimer({
    date: new Date(),
    tasks,
    sessions,
    storageKey,
    onAddSession,
  });

  return (
    <>
      {timer.active && !isOpen && <ActivePomodoroBar timer={timer} onExpand={onOpen} />}
      {isOpen && (
        <PomodoroModal
          timer={timer}
          onDeleteSession={onDeleteSession}
          onTimerStarted={onClose}
          onClose={onClose}
        />
      )}
    </>
  );
};
