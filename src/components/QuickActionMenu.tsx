import React, { useEffect, useState } from 'react';
import { DollarSign, LayoutGrid, Plus, Timer, X } from 'lucide-react';

interface QuickActionMenuProps {
  onAddTask: () => void;
  onAddMoney: () => void;
  onStartFocus: () => void;
}

const actionButtonClass = 'grid h-12 w-12 place-items-center rounded-full shadow-float transition-[background-color,transform] duration-200 hover:-translate-y-0.5 active:translate-y-px';

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  onAddTask,
  onAddMoney,
  onStartFocus,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const runAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2" aria-label="快速操作">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${actionButtonClass} bg-accent text-accent-ink hover:bg-accent-strong`}
        aria-label={isOpen ? '收合快速操作' : '展開快速操作'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={21} strokeWidth={2} /> : <LayoutGrid size={20} strokeWidth={2} />}
      </button>

      {isOpen && (
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-control border border-line bg-surface/95 px-2.5 py-1.5 text-xs font-medium text-ink shadow-panel backdrop-blur">新增任務</span>
            <button
              type="button"
              onClick={() => runAction(onAddTask)}
              className={`${actionButtonClass} bg-task text-task-ink hover:bg-task-hover`}
              aria-label="新增任務"
            >
              <Plus size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-control border border-line bg-surface/95 px-2.5 py-1.5 text-xs font-medium text-ink shadow-panel backdrop-blur">新增收支</span>
            <button
              type="button"
              onClick={() => runAction(onAddMoney)}
              className={`${actionButtonClass} bg-positive text-canvas hover:bg-emerald-300`}
              aria-label="新增收支"
            >
              <DollarSign size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-control border border-line bg-surface/95 px-2.5 py-1.5 text-xs font-medium text-ink shadow-panel backdrop-blur">開始專注</span>
            <button
              type="button"
              onClick={() => runAction(onStartFocus)}
              className={`${actionButtonClass} bg-focus text-canvas hover:brightness-110`}
              aria-label="開始專注"
            >
              <Timer size={21} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
