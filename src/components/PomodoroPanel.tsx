import React from 'react';
import { Check, Pause, Play, RotateCcw, Timer, Trash2 } from 'lucide-react';
import { PomodoroSession } from '../types';
import { formatPomodoroClock, PomodoroTimerController } from '../usePomodoroTimer';
import { Button } from './Button';
import { getRecurrenceLabel, getTaskRecurrence } from '../utils';

interface PomodoroPanelProps {
  timer: PomodoroTimerController;
  onDeleteSession: (id: string) => void;
  onTimerStarted?: () => void;
}

const formatSessionTime = (session: PomodoroSession) => {
  const format = (iso: string) => new Date(iso).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${format(session.startTime)}–${format(session.endTime)}`;
};

export const PomodoroPanel: React.FC<PomodoroPanelProps> = ({
  timer,
  onDeleteSession,
  onTimerStarted,
}) => {
  const startTimer = () => {
    if (timer.startTimer()) onTimerStarted?.();
  };

  return (
    <section className="rounded-xl border border-white/[0.09] bg-[#151a21] p-4 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3 pr-10">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
            <Timer size={16} className="text-amber-300" /> 今日專注
          </div>
          <p className="mt-1 text-[11px] text-gray-500">實際投入 {Math.round(timer.dayTotalSeconds / 60)} 分鐘</p>
        </div>
        <span className="rounded-md bg-amber-300/10 px-2 py-1 font-mono text-xs text-amber-200">
          {timer.daySessions.length} 回
        </span>
      </div>

      {timer.active ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
          <div className="mb-1 truncate text-sm font-semibold text-white">{timer.active.taskTitle}</div>
          <div className="mb-4 text-xs text-gray-500">目標 {timer.active.targetMinutes} 分鐘</div>
          <div className="mb-4 text-center font-mono text-4xl font-semibold tracking-[-0.06em] text-amber-200">
            {formatPomodoroClock(timer.remainingSeconds)}
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Button size="sm" onClick={timer.active.runningSince ? timer.pauseTimer : timer.resumeTimer}>
              {timer.active.runningSince ? <Pause size={14} /> : <Play size={14} />}
              {timer.active.runningSince ? '暫停' : '繼續'}
            </Button>
            <Button size="sm" variant="secondary" onClick={timer.finishTimer}>
              <Check size={14} /> 完成
            </Button>
            <Button size="sm" variant="ghost" onClick={timer.discardTimer} aria-label="放棄本回專注" title="放棄">
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <select
            value={timer.effectiveSelectedTaskId}
            onChange={(event) => timer.setSelectedTaskId(event.target.value)}
            className="w-full rounded-lg border border-white/[0.1] bg-[#0b0d10] px-3 py-2.5 text-sm text-gray-200 focus:border-accent/70 focus:outline-none"
            disabled={timer.availableTasks.length === 0}
            aria-label="選擇專注任務"
          >
            {timer.availableTasks.length === 0 && <option value="">今天沒有可選任務</option>}
            {timer.availableTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {getTaskRecurrence(task) !== 'none' ? `${getRecurrenceLabel(task)} · ` : ''}{task.title}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            {[25, 50].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => timer.setTargetMinutes(minutes)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${timer.targetMinutes === minutes ? 'border-accent/50 bg-accent-muted text-accent-strong' : 'border-white/[0.08] text-gray-500 hover:text-gray-200'}`}
              >
                {minutes} 分鐘
              </button>
            ))}
          </div>
          <Button className="w-full" onClick={startTimer} disabled={!timer.effectiveSelectedTaskId}>
            <Play size={15} /> 開始專注
          </Button>
        </div>
      )}

      <div className="mt-4 border-t border-white/[0.08] pt-3">
        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
          {timer.daySessions.length === 0 && <p className="py-4 text-center text-xs text-gray-600">還沒有專注紀錄</p>}
          {timer.daySessions.map((session) => (
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
