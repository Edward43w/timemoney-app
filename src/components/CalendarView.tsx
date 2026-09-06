import React, { useEffect, useState } from 'react';
import { Task, Expense, Income, PomodoroSession } from '../types';
import { isSameDay, getWeekRange, formatCurrency, formatDateISO, isTaskVisibleOnDate, getTaskTimeRangeForDate } from '../utils';
import { ChevronLeft, ChevronRight, X, Clock, Calendar as CalendarIcon, DollarSign, Flag, Trash2 } from 'lucide-react';
import { DEFAULT_TASK_FORM, TaskFormState, formStateToTaskFields, formatDuration, taskToFormState } from '../taskFormUtils';
import { Button } from './Button';
import { TaskFormModal } from './TaskFormModal';

interface CalendarViewProps {
  viewMode: 'day' | 'week' | 'month';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  expenses: Expense[];
  incomes: Income[];
  onTaskSchedule: (taskId: string, date: string, time: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteIncome: (id: string) => void;
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void;
  pomodoroSessions: PomodoroSession[];
}

const VIEW_LABELS = { day: '日', week: '週', month: '月' } as const;

export const CalendarView: React.FC<CalendarViewProps> = ({
  viewMode,
  currentDate,
  onDateChange,
  tasks,
  expenses,
  incomes,
  onTaskSchedule,
  onUpdateTask,
  onDeleteTask,
  onDeleteExpense,
  onDeleteIncome,
  onViewModeChange,
  pomodoroSessions,
}) => {
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTaskForm, setEditingTaskForm] = useState<TaskFormState>(DEFAULT_TASK_FORM);
  useEffect(() => {
    if (!selectedDayDetails && !editingTask) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedDayDetails(null);
      setEditingTask(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingTask, selectedDayDetails]);

  const openTaskEditor = (task: Task) => {
    setEditingTask(task);
    setEditingTaskForm(taskToFormState(task));
  };

  const closeTaskEditor = () => {
    setEditingTask(null);
  };

  const saveEditingTask = () => {
    if (!editingTask || !editingTaskForm.title.trim()) return;
    onUpdateTask({
      ...editingTask,
      ...formStateToTaskFields(editingTaskForm),
    });
    closeTaskEditor();
  };

  const deleteEditingTask = () => {
    if (!editingTask) return;
    onDeleteTask(editingTask.id);
    closeTaskEditor();
  };

  const renderDeadlineChips = (deadlines: Task[], maxItems: number, dense = false) => {
    if (deadlines.length === 0) return null;

    const visibleDeadlines = deadlines.slice(0, maxItems);
    const hiddenCount = deadlines.length - visibleDeadlines.length;

    return (
      <div className={dense ? 'space-y-0.5' : 'space-y-1'}>
        {visibleDeadlines.map((deadline) => (
          <button
            key={deadline.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openTaskEditor(deadline);
            }}
            className={`flex w-full min-w-0 items-center gap-1 rounded border border-red-500/30 bg-red-500/10 text-left text-red-200 hover:bg-red-500/20 ${
              dense ? 'px-1 py-0.5 text-[9px] md:text-[10px]' : 'px-2 py-1 text-[11px]'
            }`}
            title={`Deadline: ${deadline.title}${deadline.deadlineTime ? ` @ ${deadline.deadlineTime}` : ''}`}
          >
            <Flag size={dense ? 9 : 11} className="shrink-0 text-red-400" fill="currentColor" />
            <span className="truncate">{deadline.title}</span>
            {deadline.deadlineTime && (
              <span className="ml-auto shrink-0 rounded bg-red-900/40 px-1 text-[9px] text-red-100">
                {deadline.deadlineTime}
              </span>
            )}
          </button>
        ))}
        {hiddenCount > 0 && (
          <div className={dense ? 'pl-1 text-[9px] text-red-300/80' : 'text-[10px] text-red-300/80'}>
            +{hiddenCount} deadlines
          </div>
        )}
      </div>
    );
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-700/80');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-gray-700/80');
  };

  const handleDrop = (e: React.DragEvent, date: Date, time?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-700/80');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
        onTaskSchedule(taskId, formatDateISO(date), time || '');
    }
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    onDateChange(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    onDateChange(d);
  };

  const getDayStats = (date: Date) => {
    const dateStr = formatDateISO(date);
    
    // Scheduled tasks
    const dayTasks = tasks.filter(t => isTaskVisibleOnDate(t, date));
    dayTasks.sort((a,b) => (a.time || '00:00') > (b.time || '00:00') ? 1 : -1);

    // Deadlines
    const deadlines = tasks.filter(t => t.deadline === dateStr);

    const dayExpenses = expenses.filter(e => e.date === dateStr);
    const dayIncomes = incomes.filter(i => i.date === dateStr);
    const totalSpent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = dayIncomes.reduce((sum, income) => sum + income.amount, 0);
    const netCashFlow = totalIncome - totalSpent;
    
    return { dayTasks, dayExpenses, dayIncomes, totalSpent, totalIncome, netCashFlow, deadlines };
  };

  // 計算周/月開銷統計
  const getPeriodStats = () => {
    if (viewMode === 'week') {
      const weekRange = getWeekRange(currentDate);
      const weekExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= weekRange.start && expenseDate <= weekRange.end;
      });
      const weekIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= weekRange.start && incomeDate <= weekRange.end;
      });
      const totalSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = weekIncomes.reduce((sum, income) => sum + income.amount, 0);
      return { netCashFlow: totalIncome - totalSpent, period: 'week' };
    } else if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
      });
      const monthIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate.getFullYear() === year && incomeDate.getMonth() === month;
      });
      const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = monthIncomes.reduce((sum, income) => sum + income.amount, 0);
      return { netCashFlow: totalIncome - totalSpent, period: 'month' };
    }
    return null;
  };

  // --- MONTH VIEW ---
  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); 
    const daysInMonth = lastDay.getDate();

    const grid = [];
    for(let i=0; i<startPadding; i++) grid.push(<div key={`pad-${i}`} className="min-h-0 bg-gray-800/30 border border-gray-600/50"></div>);
    
    for(let d=1; d<=daysInMonth; d++) {
        const date = new Date(year, month, d);
        const { dayTasks, totalSpent, totalIncome, netCashFlow, deadlines } = getDayStats(date);
        const isToday = isSameDay(date, new Date());
        const visibleTaskLimit = deadlines.length > 0 ? 2 : 3;

        grid.push(
            <div 
              key={d} 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
              onClick={() => setSelectedDayDetails(date)}
              className={`relative min-h-0 border border-white/[0.07] p-1 md:p-2 flex flex-col justify-between group hover:bg-white/[0.045] transition-colors cursor-pointer ${isToday ? 'bg-accent-muted ring-1 ring-accent/45' : 'bg-[#111419]'}`}
            >
               <div className="flex justify-between items-start">
                  <span className={`text-xs md:text-sm font-semibold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-accent text-accent-ink' : 'text-gray-400'}`}>{d}</span>
               </div>

               <div className="flex-1 mt-1 space-y-0.5 md:space-y-1 overflow-hidden">
                  {renderDeadlineChips(deadlines, 2, true)}
                  {dayTasks.slice(0, visibleTaskLimit).map(task => (
                      <div 
                        key={task.id} 
                        className="cursor-pointer truncate rounded border-l-2 border-task-line bg-task px-1 py-0.5 text-[9px] text-task-ink shadow-sm transition-colors hover:bg-task-hover md:text-[10px]"
                        onClick={(e) => { e.stopPropagation(); openTaskEditor(task); }}
                      >
                          {task.time && <span className="opacity-80 mr-1 hidden xs:inline">{task.time}</span>}
                          {task.title}
                      </div>
                  ))}
                  {dayTasks.length > visibleTaskLimit && <div className="text-[8px] md:text-[9px] text-gray-500 pl-1">+{dayTasks.length - visibleTaskLimit} more</div>}
               </div>

               {(totalSpent > 0 || totalIncome > 0) && (
                   <div className={`mt-0.5 md:mt-1 text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded flex items-center justify-end gap-1 ${
                    netCashFlow >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                   }`}>
                       <DollarSign size={8} /> {netCashFlow >= 0 ? '+' : '-'}{Math.abs(Math.round(netCashFlow))}
                   </div>
               )}
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 flex flex-col">
            <div className="grid grid-cols-7 text-center text-[10px] md:text-xs text-gray-500 font-medium py-2 border-b border-gray-600">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 flex-1 min-h-0 overflow-hidden" style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}>
                {grid}
            </div>
        </div>
    );
  };

  // --- WEEK VIEW ---
  const renderWeek = () => {
    const { start } = getWeekRange(currentDate);
    const weekDays = [];
    for(let i=0; i<7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        weekDays.push(d);
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
             {/* Wrap content in a horizontal scroll container for mobile */}
             <div className="flex-1 overflow-auto custom-scrollbar">
                 <div className="min-w-[700px] h-full flex flex-col"> {/* Min-width forces scroll on small screens */}
                     <div className="grid grid-cols-7 text-center border-b border-gray-600 bg-gray-800/50 sticky top-0 z-10">
                         {weekDays.map((d, i) => {
                             const isToday = isSameDay(d, new Date());
                             const { totalSpent, totalIncome, netCashFlow, deadlines } = getDayStats(d);
                             return (
                                <div key={i} className={`py-3 px-1 border-r border-gray-600 last:border-r-0 ${isToday ? 'bg-gray-700' : ''}`}>
                                     <div className="text-xs text-gray-500 uppercase flex items-center justify-center gap-1">
                                         {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                         {deadlines.length > 0 && (
                                           <span className="flex items-center gap-0.5 rounded bg-red-500/10 px-1 text-[10px] text-red-300">
                                             <Flag size={9} fill="currentColor" /> {deadlines.length}
                                           </span>
                                         )}
                                     </div>
                                     <button
                                        type="button"
                                        className={`text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full cursor-pointer hover:bg-white/[0.08] ${isToday ? 'bg-accent text-accent-ink hover:bg-accent-strong' : 'text-white'}`}
                                        onClick={() => setSelectedDayDetails(d)}
                                        aria-label={`查看 ${formatDateISO(d)} 當日資訊`}
                                     >
                                         {d.getDate()}
                                     </button>
                                     <div className={`mt-1 text-xs font-mono font-medium ${
                                      totalSpent > 0 || totalIncome > 0 ? (netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-600'
                                     }`}>
                                         {totalSpent > 0 || totalIncome > 0 ? `${netCashFlow >= 0 ? '+' : '-'}$${Math.abs(Math.round(netCashFlow))}` : '-'}
                                     </div>
                                </div>
                             )
                         })}
                     </div>
                     
                     <div className="grid grid-cols-7 flex-1 min-h-[400px]">
                        {weekDays.map((d, i) => {
                             const { dayTasks, deadlines } = getDayStats(d);
                             const visibleTaskLimit = deadlines.length > 0 ? 4 : dayTasks.length;
                             return (
                                 <div 
                                    key={i} 
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, d)}
                                    className="border-r border-gray-600 p-1 space-y-1 relative group hover:bg-gray-800/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedDayDetails(d)}
                                 >
                                     {renderDeadlineChips(deadlines, 2)}
                                     {dayTasks.slice(0, visibleTaskLimit).map(task => (
                                         <div 
                                            key={task.id} 
                                            className="mb-1 cursor-pointer rounded border border-task-line/40 bg-task p-1.5 text-xs text-task-ink shadow-sm transition-colors hover:bg-task-hover"
                                            onClick={(e) => { e.stopPropagation(); openTaskEditor(task); }}
                                         >
                                             <div className="font-semibold truncate">{task.title}</div>
                                             <div className="opacity-80 text-[10px] flex items-center gap-1">
                                                <Clock size={8} /> {task.time || 'All Day'}
                                             </div>
                                         </div>
                                     ))}
                                     {dayTasks.length > visibleTaskLimit && (
                                       <div className="pl-1 text-[10px] text-gray-500">+{dayTasks.length - visibleTaskLimit} more tasks</div>
                                     )}
                                 </div>
                             )
                        })}
                     </div>
                 </div>
             </div>
        </div>
    );
  };

  // --- DAY VIEW (Time Grid) ---
  const renderDay = () => {
    const { dayTasks, dayExpenses, totalSpent, totalIncome, netCashFlow, deadlines } = getDayStats(currentDate);
    const unscheduledDayTasks = dayTasks.filter((task) => !task.time);
    const dayPomodoroSessions = pomodoroSessions.filter((session) => (
      formatDateISO(new Date(session.startTime)) === formatDateISO(currentDate)
    ));
    const hours = Array.from({length: 24}, (_, i) => i);

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 overflow-hidden relative">
             
             {/* Mobile: Compact Finance Header */}
             <div className="md:hidden flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-600 mb-2 shrink-0">
                 <div className="text-xs text-gray-400">Daily Net</div>
                 <div className="flex items-center gap-2">
                     <span className={`text-sm font-bold font-mono ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                         {formatCurrency(netCashFlow)}
                     </span>
                     <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedDayDetails(currentDate)}>
                         <DollarSign size={14} />
                     </Button>
                 </div>
             </div>

             {/* Time Grid Area */}
             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-gray-800/30 rounded-lg relative flex flex-col">
                 {(deadlines.length > 0 || unscheduledDayTasks.length > 0) && (
                 <div className="sticky top-0 z-40 flex shrink-0 flex-col gap-2 border-b border-gray-600 bg-gray-800/95 p-2 shadow-md backdrop-blur">
                     {/* Deadlines Section */}
                     {deadlines.length > 0 && (
                         <div className="mb-1">
                             <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1 font-bold">
                                 <Flag size={10} fill="currentColor" /> 今日截止
                             </div>
                             <div className="flex flex-wrap gap-2">
                                 {deadlines.map(t => (
                                     <div key={t.id} onClick={() => openTaskEditor(t)} className="bg-gray-700 border border-red-900/50 px-2 py-1 rounded text-xs text-red-200 flex items-center gap-1 cursor-pointer hover:bg-gray-600">
                                         <span className="w-1 h-3 bg-red-500 rounded-full"></span>
                                         <span>{t.title}</span>
                                         {t.deadlineTime && <span className="bg-red-900/50 px-1 rounded text-[10px]">{t.deadlineTime}</span>}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}

                     {unscheduledDayTasks.length > 0 && (
                     <div>
                        <div 
                            className="flex flex-wrap gap-2 min-h-8"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, currentDate)}
                        >
                            {unscheduledDayTasks.map(t => (
                                <div 
                                    key={t.id} 
                                    className="flex cursor-pointer items-center gap-2 rounded border border-task-line/40 bg-task px-2 py-1 text-xs text-task-ink transition-colors hover:bg-task-hover"
                                    onClick={() => openTaskEditor(t)}
                                >
                                    {t.title}
                                </div>
                            ))}
                        </div>
                     </div>
                     )}
                  </div>
                 )}

                 <div className="relative min-h-[1440px]"> {/* 24h * 60px height */}
                     {/* Hour Lines */}
                     {hours.map(h => (
                         <div 
                            key={h} 
                            className="absolute w-full h-[60px] border-b border-gray-600/50 text-xs text-gray-600 pl-2 pt-1 select-none"
                            style={{ top: `${h * 60}px` }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, currentDate, `${h.toString().padStart(2, '0')}:00`)}
                         >
                             {h.toString().padStart(2, '0')}:00
                         </div>
                     ))}
                     
                     {/* Tasks Rendering */}
                     {dayTasks.map(task => {
                         if (!task.time) return null;
                         const range = getTaskTimeRangeForDate(task, currentDate);
                         if (!range) return null;

                         const dayStart = new Date(currentDate); dayStart.setHours(0,0,0,0);
                         let startMinutes = (range.start.getTime() - dayStart.getTime()) / 60000;
                         if (startMinutes < 0) startMinutes = 0;
                         let endMinutes = (range.end.getTime() - dayStart.getTime()) / 60000;
                         if (endMinutes > 1440) endMinutes = 1440;
                         const heightMinutes = endMinutes - startMinutes;
                         
                         return (
                             <div 
                                key={task.id}
                                className="absolute left-12 right-1 z-10 cursor-pointer overflow-hidden rounded border border-task-line/45 bg-task p-1.5 shadow-lg transition-all hover:z-20 hover:scale-[1.01] hover:bg-task-hover md:left-14 md:right-2 md:p-2"
                                style={{
                                    top: `${startMinutes}px`,
                                    height: `${Math.max(heightMinutes, 30)}px`,
                                }}
                                onClick={(e) => { e.stopPropagation(); openTaskEditor(task); }}
                             >
                                 <div className="font-bold text-xs md:text-sm text-white truncate drop-shadow-md">{task.title}</div>
                                 <div className="text-[10px] md:text-xs text-white/90 flex items-center gap-1 font-medium">
                                     <Clock size={10} /> 
                                     {task.time} - {range.end.getHours().toString().padStart(2,'0')}:{range.end.getMinutes().toString().padStart(2,'0')}
                                 </div>
                             </div>
                         );
                     })}

                     {/* Actual focus blocks sit beside planned tasks for direct comparison. */}
                     {dayPomodoroSessions.map((session) => {
                         const start = new Date(session.startTime);
                         const end = new Date(session.endTime);
                         const dayStart = new Date(currentDate);
                         dayStart.setHours(0, 0, 0, 0);
                         const startMinutes = Math.max(0, (start.getTime() - dayStart.getTime()) / 60000);
                         const endMinutes = Math.min(1440, (end.getTime() - dayStart.getTime()) / 60000);
                         const wallClockMinutes = Math.max(1, endMinutes - startMinutes);

                         return (
                           <div
                             key={session.id}
                             className="pointer-events-none absolute right-2 left-[55%] z-20 overflow-hidden rounded-md border border-dashed border-amber-200/70 bg-[#17150d]/95 px-2 py-1 shadow-lg shadow-black/30"
                             style={{
                               top: `${startMinutes}px`,
                               height: `${Math.max(wallClockMinutes, 24)}px`,
                               borderLeftColor: session.taskColor,
                               borderLeftWidth: 4,
                             }}
                           >
                             <div className="truncate text-[11px] font-semibold text-amber-100">實際 · {session.taskTitle}</div>
                             {wallClockMinutes >= 28 && (
                               <div className="font-mono text-[9px] text-amber-200/65">
                                 {start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}–{end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                               </div>
                             )}
                           </div>
                         );
                     })}

                     {/* Current Time Indicator */}
                     {isSameDay(currentDate, new Date()) && (
                         <div 
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                            style={{ top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}
                         >
                             <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                         </div>
                     )}
                 </div>
             </div>

             {/* Daily actuals rail (Desktop Only) */}
             <div className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar md:flex">
              <section className="shrink-0 rounded-xl border border-white/[0.09] bg-[#151a21] p-4 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-600 pb-2 flex items-center justify-between">
                    Daily Finance
                    <span className="text-[10px] text-gray-500">{formatDateISO(currentDate)}</span>
                 </h3>
                 
                 <div className="text-center mb-6 bg-gray-900 rounded-lg p-4 border border-gray-600">
                     <div className="text-gray-500 text-xs uppercase tracking-widest">Net Cash Flow</div>
                     <div className={`mt-2 font-mono text-3xl font-bold ${netCashFlow >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatCurrency(netCashFlow)}</div>
                     <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-300">+{formatCurrency(totalIncome)}</div>
                        <div className="rounded bg-red-500/10 px-2 py-1 text-red-300">-{formatCurrency(totalSpent)}</div>
                     </div>
                 </div>

                 <div className="max-h-36 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                     {dayExpenses.length === 0 && <div className="text-xs text-center text-gray-600 py-8 italic">No expenses recorded today</div>}
                     {dayExpenses.map(expense => (
                         <div key={expense.id} className="flex items-center justify-between text-sm group p-2 rounded hover:bg-gray-700 transition-colors">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center text-gray-400">
                                     <DollarSign size={14} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-gray-200 font-medium truncate max-w-[100px]">{expense.title}</span>
                                    <span className="text-[10px] text-gray-500">{expense.category}</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="font-mono text-white font-bold">-{formatCurrency(expense.amount)}</span>
                                 <button 
                                     onClick={(event) => {
                                         event.stopPropagation();
                                         onDeleteExpense(expense.id);
                                     }}
                                     className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded transition-all"
                                     title="Delete expense"
                                 >
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
              </section>
             </div>
        </div>
    );
  };

  // --- TASK EDIT MODAL ---
  const renderTaskEditModal = () => {
    if (!editingTask) return null;

    return (
      <TaskFormModal
        title="Edit Task"
        description="This uses the same duration and time controls as new tasks."
        value={editingTaskForm}
        onChange={setEditingTaskForm}
        onClose={closeTaskEditor}
        onSubmit={saveEditingTask}
        submitLabel="Save Changes"
        onDelete={deleteEditingTask}
      />
    );
  };

  // --- DAY DETAIL MODAL (Existing, for generic day click) ---
  const renderDayDetailModal = () => {
     if (!selectedDayDetails) return null;
     const { dayTasks, dayExpenses, dayIncomes, totalSpent, totalIncome, netCashFlow, deadlines } = getDayStats(selectedDayDetails);
     
     return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="day-detail-title"
                 className="flex max-h-[90dvh] w-full max-w-sm scale-100 animate-in flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#12161b] shadow-2xl zoom-in-95 duration-200 md:max-w-md"
                 onClick={(e) => e.stopPropagation()}
              >
                 {/* Header */}
                  <div className="relative shrink-0 border-b border-white/[0.08] bg-[#15191f] p-6">
                      <button
                        onClick={() => setSelectedDayDetails(null)} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        aria-label="關閉日期詳情"
                     >
                         <X size={20} />
                     </button>
                      <div id="day-detail-title" className="mb-1 text-3xl font-semibold tracking-[-0.04em] text-white">{selectedDayDetails.getDate()}</div>
                      <div className="text-gray-400 font-medium uppercase tracking-wider text-sm">
                          {selectedDayDetails.toLocaleDateString('zh-TW', { weekday: 'long', month: 'long' })}
                     </div>
                 </div>

                 <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                     {/* Tasks Section */}
                     <div className="p-6 pb-2">
                        <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2 mb-4">
                            <CalendarIcon size={16} className="text-blue-500" />
                            Schedule
                        </h4>
                        <div className="space-y-4 border-l border-gray-600 ml-2 pl-6 relative">
                            {dayTasks.length === 0 && <div className="text-sm text-gray-600 italic">No tasks scheduled</div>}
                            {dayTasks.map(t => (
                                <div key={t.id} className="relative group cursor-pointer" onClick={() => { setSelectedDayDetails(null); openTaskEditor(t); }}>
                                    <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-[#0b0d10] bg-task-line"></div>
                                    <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">{t.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                        <span>{t.time ? t.time : 'All Day'}</span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                        <span>{formatDuration(t.durationMinutes)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     {/* Divider */}
                     <div className="h-px bg-gray-700 mx-6 my-2"></div>

                     {/* Deadlines Section */}
                     <div className="p-6 py-2">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-200">
                            <Flag size={16} className="text-red-400" />
                            Deadlines
                        </h4>
                        <div className="space-y-2">
                            {deadlines.length === 0 && <div className="text-sm text-gray-600 italic">No deadlines due</div>}
                            {deadlines.map((deadline) => (
                                <button
                                    key={deadline.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedDayDetails(null);
                                        openTaskEditor(deadline);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-left text-sm text-red-100 hover:bg-red-500/20"
                                >
                                    <Flag size={14} className="shrink-0 text-red-400" fill="currentColor" />
                                    <span className="min-w-0 flex-1 truncate">{deadline.title}</span>
                                    {deadline.deadlineTime && (
                                        <span className="rounded bg-red-900/40 px-2 py-0.5 text-xs">{deadline.deadlineTime}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                     </div>

                     {/* Divider */}
                     <div className="h-px bg-gray-700 mx-6 my-2"></div>

                     {/* Cash Flow Section */}
                     <div className="px-6 py-2">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-200">
                            <DollarSign size={16} className="text-emerald-400" />
                            Daily Cash Flow
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                                <div className="text-gray-400">Income</div>
                                <div className="mt-1 font-mono font-bold text-emerald-300">{formatCurrency(totalIncome)}</div>
                            </div>
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2">
                                <div className="text-gray-400">Expense</div>
                                <div className="mt-1 font-mono font-bold text-red-300">{formatCurrency(totalSpent)}</div>
                            </div>
                            <div className={`rounded-lg border p-2 ${netCashFlow >= 0 ? 'border-blue-500/20 bg-blue-500/10' : 'border-orange-500/20 bg-orange-500/10'}`}>
                                <div className="text-gray-400">Net</div>
                                <div className={`mt-1 font-mono font-bold ${netCashFlow >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>{formatCurrency(netCashFlow)}</div>
                            </div>
                        </div>
                     </div>

                     {/* Divider */}
                     <div className="h-px bg-gray-700 mx-6 my-2"></div>

                     {/* Expenses Section */}
                     <div className="p-6 pt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <DollarSign size={16} className="text-red-400" />
                                Expenses
                            </h4>
                            <span className={`text-sm font-mono font-bold ${totalSpent > 0 ? 'text-red-300' : 'text-gray-300'}`}>
                                Total: {formatCurrency(totalSpent)}
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {dayExpenses.length === 0 && <div className="text-sm text-gray-600 italic">No expenses recorded</div>}
                            {dayExpenses.map(expense => (
                                <div key={expense.id} className="flex items-center justify-between rounded border border-red-500/20 bg-red-500/10 p-2 text-sm">
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-red-100">{expense.title}</div>
                                        <div className="text-xs text-red-300/70">{expense.category}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-red-200">-{formatCurrency(expense.amount)}</span>
                                        <Button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onDeleteExpense(expense.id);
                                            }}
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 border-t border-gray-700 pt-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Income</h5>
                                <span className="text-xs font-mono text-emerald-300">{formatCurrency(totalIncome)}</span>
                            </div>
                            <div className="space-y-2">
                                {dayIncomes.length === 0 && <div className="text-sm text-gray-600 italic">No income recorded</div>}
                                {dayIncomes.map(income => (
                                    <div key={income.id} className="flex items-center justify-between rounded border border-emerald-500/20 bg-emerald-500/10 p-2 text-sm">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-emerald-100">{income.title}</div>
                                            <div className="text-xs text-emerald-300/70">{income.category}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-emerald-200">+{formatCurrency(income.amount)}</span>
                                            <Button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onDeleteIncome(income.id);
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="p-1 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                     </div>
                 </div>

                 {/* Footer Action */}
                 <div className="p-4 bg-gray-900 border-t border-gray-600 flex justify-center shrink-0">
                    <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                            onDateChange(selectedDayDetails);
                            onViewModeChange('day');
                            setSelectedDayDetails(null);
                        }}
                    >
                        Go to Day View
                    </Button>
                 </div>
             </div>
         </div>
     )
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#101318] shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:rounded-2xl">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-[#12161b] px-3 py-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <h2 className="truncate text-lg font-semibold tracking-[-0.025em] text-white md:text-2xl">
              {currentDate.toLocaleDateString('zh-TW', viewMode === 'day'
                ? { year: 'numeric', month: 'long', day: 'numeric' }
                : { month: 'long', year: 'numeric' })}
          </h2>
          {/* 開銷統計顯示 */}
          {(viewMode === 'week' || viewMode === 'month') && (() => {
            const periodStats = getPeriodStats();
            if (!periodStats) return null;
            return (
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                periodStats.netCashFlow < 0
                  ? 'bg-red-900/20 border border-red-500/30 text-red-400'
                  : 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-400'
              }`}>
                <span className="text-xs opacity-75">{periodStats.period === 'week' ? '週' : '月'}淨額: </span>
                {formatCurrency(periodStats.netCashFlow)}
              </div>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#0b0d10] p-1" aria-label="行事曆檢視">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors md:px-2.5 ${viewMode === mode ? 'bg-accent text-accent-ink shadow-accent' : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-200'}`}
                aria-pressed={viewMode === mode}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#0b0d10] p-1">
             <Button variant="ghost" onClick={handlePrev} size="sm" className="h-7 w-7 p-0 md:h-8 md:w-8" aria-label="上一個期間"><ChevronLeft size={16}/></Button>
             <Button variant="ghost" onClick={() => onDateChange(new Date())} size="sm" className="h-7 px-2 text-xs md:h-8">今天</Button>
             <Button variant="ghost" onClick={handleNext} size="sm" className="h-7 w-7 p-0 md:h-8 md:w-8" aria-label="下一個期間"><ChevronRight size={16}/></Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-0 relative">
        {viewMode === 'month' && renderMonth()}
        {viewMode === 'week' && renderWeek()}
        {viewMode === 'day' && renderDay()}
      </div>

      {/* Render Modals */}
      {renderDayDetailModal()}
      {renderTaskEditModal()}
    </div>
  );
};
