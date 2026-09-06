import { useCallback, useEffect, useMemo, useState } from 'react';
import { PomodoroSession, Task } from './types';
import { formatDateISO, isTaskVisibleOnDate } from './utils';

export interface ActivePomodoro {
  taskId: string;
  taskTitle: string;
  taskColor: string;
  targetMinutes: number;
  startedAt: string;
  accumulatedSeconds: number;
  runningSince?: string;
}

interface UsePomodoroTimerOptions {
  date: Date;
  tasks: Task[];
  sessions: PomodoroSession[];
  storageKey: string;
  onAddSession: (session: PomodoroSession) => void;
}

export interface PomodoroTimerController {
  active: ActivePomodoro | null;
  availableTasks: Task[];
  daySessions: PomodoroSession[];
  dayTotalSeconds: number;
  effectiveSelectedTaskId: string;
  selectedTaskId: string;
  setSelectedTaskId: (taskId: string) => void;
  targetMinutes: number;
  setTargetMinutes: (minutes: number) => void;
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercent: number;
  startTimer: () => boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  finishTimer: () => void;
  discardTimer: () => void;
}

export const formatPomodoroClock = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
};

const getElapsedSeconds = (active: ActivePomodoro, now: number) => {
  const runningSeconds = active.runningSince
    ? Math.max(0, Math.floor((now - new Date(active.runningSince).getTime()) / 1000))
    : 0;
  return active.accumulatedSeconds + runningSeconds;
};

const readActivePomodoro = (storageKey: string): ActivePomodoro | null => {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) as ActivePomodoro : null;
  } catch {
    return null;
  }
};

export const usePomodoroTimer = ({
  date,
  tasks,
  sessions,
  storageKey,
  onAddSession,
}: UsePomodoroTimerOptions): PomodoroTimerController => {
  const [active, setActive] = useState<ActivePomodoro | null>(() => readActivePomodoro(storageKey));
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [now, setNow] = useState(0);
  const selectedDate = formatDateISO(date);
  const today = formatDateISO(new Date());
  const isToday = selectedDate === today;
  useEffect(() => {
    try {
      if (active) window.localStorage.setItem(storageKey, JSON.stringify(active));
      else window.localStorage.removeItem(storageKey);
    } catch {
      // The timer still works when browser storage is unavailable.
    }
  }, [active, storageKey]);

  const availableTasks = useMemo(() => tasks.filter((task) => (
    isTaskVisibleOnDate(task, date)
  )), [date, tasks]);

  const daySessions = useMemo(() => sessions
    .filter((session) => formatDateISO(new Date(session.startTime)) === selectedDate)
    .sort((a, b) => b.startTime.localeCompare(a.startTime)), [selectedDate, sessions]);

  const effectiveSelectedTaskId = availableTasks.some((task) => task.id === selectedTaskId)
    ? selectedTaskId
    : availableTasks[0]?.id ?? '';

  const saveSession = useCallback((finished: ActivePomodoro, focusSeconds: number) => {
    onAddSession({
      id: `temp-${Date.now()}`,
      taskId: finished.taskId,
      taskTitle: finished.taskTitle,
      taskColor: finished.taskColor,
      startTime: finished.startedAt,
      endTime: new Date().toISOString(),
      focusSeconds,
      targetMinutes: finished.targetMinutes,
    });
  }, [onAddSession]);

  useEffect(() => {
    if (!active?.runningSince) return;
    const timerId = window.setInterval(() => {
      const tick = Date.now();
      const tickElapsed = getElapsedSeconds(active, tick);
      if (tickElapsed >= active.targetMinutes * 60) {
        saveSession(active, tickElapsed);
        setActive(null);
      }
      setNow(tick);
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [active, saveSession]);

  const elapsedSeconds = active ? getElapsedSeconds(active, now) : 0;
  const remainingSeconds = active ? Math.max(0, active.targetMinutes * 60 - elapsedSeconds) : targetMinutes * 60;
  const progressPercent = active
    ? Math.min(100, (elapsedSeconds / (active.targetMinutes * 60)) * 100)
    : 0;

  const startTimer = () => {
    const task = availableTasks.find((candidate) => candidate.id === effectiveSelectedTaskId);
    if (!task || !isToday) return false;
    const startedAt = new Date().toISOString();
    setNow(Date.now());
    setActive({
      taskId: task.id,
      taskTitle: task.title,
      taskColor: task.color || '#304a60',
      targetMinutes,
      startedAt,
      accumulatedSeconds: 0,
      runningSince: startedAt,
    });
    return true;
  };

  const pauseTimer = () => {
    if (!active?.runningSince) return;
    setActive({
      ...active,
      accumulatedSeconds: getElapsedSeconds(active, Date.now()),
      runningSince: undefined,
    });
  };

  const resumeTimer = () => {
    if (!active || active.runningSince) return;
    const runningSince = new Date().toISOString();
    setNow(Date.now());
    setActive({ ...active, runningSince });
  };

  const finishTimer = () => {
    if (!active) return;
    saveSession(active, Math.max(1, getElapsedSeconds(active, Date.now())));
    setActive(null);
    setNow(Date.now());
  };

  const discardTimer = () => {
    setActive(null);
    setNow(Date.now());
  };

  return {
    active,
    availableTasks,
    daySessions,
    dayTotalSeconds: daySessions.reduce((sum, session) => sum + session.focusSeconds, 0),
    effectiveSelectedTaskId,
    selectedTaskId,
    setSelectedTaskId,
    targetMinutes,
    setTargetMinutes,
    elapsedSeconds,
    remainingSeconds,
    progressPercent,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    discardTimer,
  };
};
