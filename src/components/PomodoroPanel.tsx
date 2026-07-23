import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Pause, Play, RotateCcw, Timer, Trash2 } from 'lucide-react';
import { PomodoroSession, Task } from '../types';
import { formatDateISO, isTaskVisibleOnDate } from '../utils';
import { Button } from './Button';

interface PomodoroPanelProps {
  date: Date;
  tasks: Task[];
  sessions: PomodoroSession[];
  storageKey: string;
  onAddSession: (session: PomodoroSession) => void;
  onDeleteSession: (id: string) => void;
}

interface ActivePomodoro {
  taskId: string;
  taskTitle: string;
  taskColor: string;
  targetMinutes: number;
  startedAt: string;
  accumulatedSeconds: number;
  runningSince?: string;
}

const formatClock = (seconds: number) => {
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

const formatSessionTime = (session: PomodoroSession) => {
  const format = (iso: string) => new Date(iso).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${format(session.startTime)}–${format(session.endTime)}`;
};

const readActivePomodoro = (storageKey: string): ActivePomodoro | null => {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) as ActivePomodoro : null;
  } catch {
    return null;
  }
};

export const PomodoroPanel: React.FC<PomodoroPanelProps> = ({
  date,
  tasks,
  sessions,
  storageKey,
  onAddSession,
  onDeleteSession,
}) => {
  const [active, setActive] = useState<ActivePomodoro | null>(() => readActivePomodoro(storageKey));
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [now, setNow] = useState(0);
  const selectedDate = formatDateISO(date);
  const today = formatDateISO(new Date());
  const isToday = selectedDate === today;

  const availableTasks = useMemo(() => tasks.filter((task) => (
    task.isDaily || isTaskVisibleOnDate(task, date)
  )), [date, tasks]);

  const daySessions = useMemo(() => sessions
    .filter((session) => formatDateISO(new Date(session.startTime)) === selectedDate)
    .sort((a, b) => b.startTime.localeCompare(a.startTime)), [selectedDate, sessions]);

  const effectiveSelectedTaskId = availableTasks.some((task) => task.id === selectedTaskId)
    ? selectedTaskId
    : availableTasks[0]?.id ?? '';

  const saveSession = useCallback((finished: ActivePomodoro, focusSeconds: number) => {
    const endTime = new Date().toISOString();
    onAddSession({
      id: `temp-${Date.now()}`,
      taskId: finished.taskId,
      taskTitle: finished.taskTitle,
      taskColor: finished.taskColor,
      startTime: finished.startedAt,
      endTime,
      focusSeconds,
      targetMinutes: finished.targetMinutes,
    });
  }, [onAddSession]);

  useEffect(() => {
    try {
      if (active) window.localStorage.setItem(storageKey, JSON.stringify(active));
      else window.localStorage.removeItem(storageKey);
    } catch {
      // The timer still works when browser storage is unavailable.
    }
  }, [active, storageKey]);

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

  const startTimer = () => {
    const task = availableTasks.find((candidate) => candidate.id === effectiveSelectedTaskId);
    if (!task || !isToday) return;
    const startedAt = new Date().toISOString();
    setNow(Date.now());
    setActive({
      taskId: task.id,
      taskTitle: task.title,
      taskColor: task.color || '#fbbf24',
      targetMinutes,
      startedAt,
      accumulatedSeconds: 0,
      runningSince: startedAt,
    });
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
    const finalSeconds = Math.max(1, getElapsedSeconds(active, Date.now()));
    saveSession(active, finalSeconds);
    setActive(null);
    setNow(Date.now());
  };

  const discardTimer = () => {
    setActive(null);
    setNow(Date.now());
  };

  const dayTotalSeconds = daySessions.reduce((sum, session) => sum + session.focusSeconds, 0);

  return (
    <section className="rounded-xl border border-white/[0.09] bg-[#151a21] p-4 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
            <Timer size={16} className="text-amber-300" /> 今日專注
          </div>
          <p className="mt-1 text-[11px] text-gray-500">實際投入 {Math.round(dayTotalSeconds / 60)} 分鐘</p>
        </div>
        <span className="rounded-md bg-amber-300/10 px-2 py-1 font-mono text-xs text-amber-200">
          {daySessions.length} 回
        </span>
      </div>

      {active ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
          <div className="mb-1 truncate text-sm font-semibold text-white">{active.taskTitle}</div>
          <div className="mb-4 text-xs text-gray-500">目標 {active.targetMinutes} 分鐘</div>
          <div className="mb-4 text-center font-mono text-4xl font-semibold tracking-[-0.06em] text-amber-200">
            {formatClock(remainingSeconds)}
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Button size="sm" onClick={active.runningSince ? pauseTimer : resumeTimer}>
              {active.runningSince ? <Pause size={14} /> : <Play size={14} />}
              {active.runningSince ? '暫停' : '繼續'}
            </Button>
            <Button size="sm" variant="secondary" onClick={finishTimer}>
              <Check size={14} /> 完成
            </Button>
            <Button size="sm" variant="ghost" onClick={discardTimer} aria-label="放棄本回專注" title="放棄">
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <select
            value={effectiveSelectedTaskId}
            onChange={(event) => setSelectedTaskId(event.target.value)}
            className="w-full rounded-lg border border-white/[0.1] bg-[#0b0d10] px-3 py-2.5 text-sm text-gray-200 focus:border-amber-300/70 focus:outline-none"
            disabled={!isToday || availableTasks.length === 0}
            aria-label="選擇專注任務"
          >
            {availableTasks.length === 0 && <option value="">今天沒有可選任務</option>}
            {availableTasks.map((task) => (
              <option key={task.id} value={task.id}>{task.isDaily ? '每日 · ' : ''}{task.title}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            {[25, 50].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setTargetMinutes(minutes)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${targetMinutes === minutes ? 'border-amber-300/50 bg-amber-300/10 text-amber-200' : 'border-white/[0.08] text-gray-500 hover:text-gray-200'}`}
              >
                {minutes} 分鐘
              </button>
            ))}
          </div>
          <Button className="w-full" onClick={startTimer} disabled={!isToday || !effectiveSelectedTaskId}>
            <Play size={15} /> 開始專注
          </Button>
          {!isToday && <p className="text-center text-[11px] text-gray-500">切回今天才能啟動計時器</p>}
        </div>
      )}

      <div className="mt-4 border-t border-white/[0.08] pt-3">
        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
          {daySessions.length === 0 && <p className="py-4 text-center text-xs text-gray-600">還沒有專注紀錄</p>}
          {daySessions.map((session) => (
            <div key={session.id} className="group flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#0f1318] px-2.5 py-2">
              <span className="h-7 w-1 shrink-0 rounded-full" style={{ backgroundColor: session.taskColor }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-gray-200">{session.taskTitle}</div>
                <div className="mt-0.5 font-mono text-[10px] text-gray-500">{formatSessionTime(session)} · {Math.max(1, Math.round(session.focusSeconds / 60))}m</div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteSession(session.id)}
                className="rounded p-1 text-gray-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 focus:opacity-100"
                aria-label={`刪除 ${session.taskTitle} 專注紀錄`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
