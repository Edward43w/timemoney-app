import React from 'react';
import { Check, Maximize2, Pause, Play, X } from 'lucide-react';
import { formatPomodoroClock, PomodoroTimerController } from '../usePomodoroTimer';
import { IconButton } from './ui/IconButton';

interface ActivePomodoroBarProps {
  timer: PomodoroTimerController;
  onExpand: () => void;
}

export const ActivePomodoroBar: React.FC<ActivePomodoroBarProps> = ({ timer, onExpand }) => {
  if (!timer.active) return null;
  const isRunning = Boolean(timer.active.runningSince);

  return (
    <aside
      className="fixed bottom-20 left-3 right-3 z-40 overflow-hidden rounded-panel border border-focus/30 bg-surface/95 shadow-float backdrop-blur-xl sm:bottom-4 sm:left-auto sm:right-20 sm:w-[min(26rem,calc(100vw-6rem))]"
      aria-label={`進行中的專注：${timer.active.taskTitle}`}
    >
      <div className="h-1 bg-surface-raised">
        <div
          className="h-full bg-focus transition-[width] duration-500"
          style={{ width: `${timer.progressPercent}%` }}
        />
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button type="button" onClick={onExpand} className="min-w-0 flex-1 text-left" aria-label="開啟完整專注計時器">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${isRunning ? 'bg-focus animate-pulse' : 'bg-muted'}`} />
            <span className="truncate text-sm font-semibold text-ink">{timer.active.taskTitle}</span>
            {!isRunning && <span className="shrink-0 text-[10px] font-medium text-muted">已暫停</span>}
          </div>
          <div className="mt-0.5 pl-4 font-mono text-lg font-semibold tabular-nums text-accent-strong">
            {formatPomodoroClock(timer.remainingSeconds)}
          </div>
        </button>
        <IconButton onClick={isRunning ? timer.pauseTimer : timer.resumeTimer} aria-label={isRunning ? '暫停專注' : '繼續專注'}>
          {isRunning ? <Pause size={17} /> : <Play size={17} />}
        </IconButton>
        <IconButton onClick={timer.finishTimer} tone="accent" aria-label="完成專注">
          <Check size={17} />
        </IconButton>
        <IconButton onClick={onExpand} aria-label="展開專注計時器" className="hidden sm:inline-grid">
          <Maximize2 size={16} />
        </IconButton>
        <IconButton onClick={timer.discardTimer} tone="danger" aria-label="取消專注">
          <X size={17} />
        </IconButton>
      </div>
    </aside>
  );
};
