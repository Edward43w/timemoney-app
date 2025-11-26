import React, { useState } from 'react';
import { Task, Expense, Budget, Priority, PRIORITIES } from '../types';
import { isSameDay, getWeekRange, formatCurrency, formatDateISO, isTaskVisibleOnDate, getTaskTimeRange, TASK_COLORS } from '../utils';
import { ChevronLeft, ChevronRight, X, Clock, Calendar as CalendarIcon, DollarSign, GripVertical, Flag, Trash2, Edit2 } from 'lucide-react';
import { Button } from './Button';

interface CalendarViewProps {
  viewMode: 'day' | 'week' | 'month';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  expenses: Expense[];
  budget: Budget;
  onTaskSchedule: (taskId: string, date: string, time: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  viewMode,
  currentDate,
  onDateChange,
  tasks,
  expenses,
  budget,
  onTaskSchedule,
  onUpdateTask,
  onDeleteTask
}) => {
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
    const totalSpent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const isOverBudget = totalSpent > budget.daily;
    
    return { dayTasks, dayExpenses, totalSpent, isOverBudget, deadlines };
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
    for(let i=0; i<startPadding; i++) grid.push(<div key={`pad-${i}`} className="bg-gray-800/30 border border-gray-600/50 h-[100px]"></div>);
    
    for(let d=1; d<=daysInMonth; d++) {
        const date = new Date(year, month, d);
        const { dayTasks, totalSpent, isOverBudget, deadlines } = getDayStats(date);
        const isToday = isSameDay(date, new Date());

        grid.push(
            <div 
              key={d} 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
              onClick={() => setSelectedDayDetails(date)}
              className={`relative border border-gray-600 p-1 md:p-2 h-[100px] flex flex-col justify-between group hover:bg-gray-700/50 transition-colors cursor-pointer ${isToday ? 'bg-gray-700 ring-1 ring-blue-500' : 'bg-gray-800'}`}
            >
               <div className="flex justify-between items-start">
                  <span className={`text-xs md:text-sm font-semibold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>{d}</span>
                  {/* Deadline Indicator for Month View */}
                  {deadlines.length > 0 && (
                      <div className="flex -space-x-1">
                          {deadlines.slice(0, 2).map(dt => (
                              <div key={dt.id} className="text-red-500" title={`Due: ${dt.title} ${dt.deadlineTime ? '@ ' + dt.deadlineTime : ''}`}>
                                  <Flag size={12} fill="currentColor" />
                              </div>
                          ))}
                      </div>
                  )}
               </div>

               <div className="flex-1 mt-1 space-y-0.5 md:space-y-1 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id} 
                        className="text-[9px] md:text-[10px] rounded px-1 py-0.5 truncate text-white shadow-sm border-l-2 border-white/30 hover:brightness-110 cursor-pointer"
                        style={{ backgroundColor: task.color || '#3b82f6' }}
                        onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                      >
                          {task.time && <span className="opacity-80 mr-1 hidden xs:inline">{task.time}</span>}
                          {task.title}
                      </div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-[8px] md:text-[9px] text-gray-500 pl-1">+{dayTasks.length - 3} more</div>}
               </div>

               {totalSpent > 0 && (
                   <div className={`mt-0.5 md:mt-1 text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded flex items-center justify-end gap-1 ${isOverBudget ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                       <DollarSign size={8} /> {Math.round(totalSpent)}
                   </div>
               )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 text-center text-[10px] md:text-xs text-gray-500 font-medium py-2 border-b border-gray-600">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 flex-1 overflow-y-auto" style={{ gridTemplateRows: 'repeat(6, minmax(100px, 1fr))' }}>
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
                             const { totalSpent, isOverBudget, deadlines } = getDayStats(d);
                             return (
                                <div key={i} className={`py-3 px-1 border-r border-gray-600 last:border-r-0 ${isToday ? 'bg-gray-700' : ''}`}>
                                     <div className="text-xs text-gray-500 uppercase flex items-center justify-center gap-1">
                                         {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                         {deadlines.length > 0 && <Flag size={10} className="text-red-500" fill="currentColor"/>}
                                     </div>
                                     <div 
                                        className={`text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-600 ${isToday ? 'bg-blue-600 text-white hover:bg-blue-500' : 'text-white'}`}
                                        onClick={() => setSelectedDayDetails(d)}
                                     >
                                         {d.getDate()}
                                     </div>
                                     <div className={`mt-1 text-xs font-mono font-medium ${totalSpent > 0 ? (isOverBudget ? 'text-red-400' : 'text-green-400') : 'text-gray-600'}`}>
                                         {totalSpent > 0 ? `$${Math.round(totalSpent)}` : '-'}
                                     </div>
                                </div>
                             )
                         })}
                     </div>
                     
                     <div className="grid grid-cols-7 flex-1 min-h-[400px]">
                        {weekDays.map((d, i) => {
                             const { dayTasks } = getDayStats(d);
                             return (
                                 <div 
                                    key={i} 
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, d)}
                                    className="border-r border-gray-600 p-1 space-y-1 relative group hover:bg-gray-800/50 transition-colors" 
                                    onClick={() => onDateChange(d)}
                                 >
                                     {dayTasks.map(task => (
                                         <div 
                                            key={task.id} 
                                            className="p-1.5 rounded text-xs text-white cursor-pointer mb-1 shadow-sm hover:brightness-110 border border-white/10"
                                            style={{ backgroundColor: task.color || '#3b82f6' }}
                                            onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                         >
                                             <div className="font-semibold truncate">{task.title}</div>
                                             <div className="opacity-80 text-[10px] flex items-center gap-1">
                                                <Clock size={8} /> {task.time || 'All Day'}
                                             </div>
                                         </div>
                                     ))}
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
    const { dayTasks, dayExpenses, totalSpent, isOverBudget, deadlines } = getDayStats(currentDate);
    const hours = Array.from({length: 24}, (_, i) => i);

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 overflow-hidden relative">
             
             {/* Mobile: Compact Finance Header */}
             <div className="md:hidden flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-600 mb-2 shrink-0">
                 <div className="text-xs text-gray-400">Daily Spending</div>
                 <div className="flex items-center gap-2">
                     <span className={`text-sm font-bold font-mono ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                         {formatCurrency(totalSpent)}
                     </span>
                     <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedDayDetails(currentDate)}>
                         <DollarSign size={14} />
                     </Button>
                 </div>
             </div>

             {/* Time Grid Area */}
             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-gray-800/30 rounded-lg relative flex flex-col">
                 {/* Unscheduled / Deadlines Bucket */}
                 <div className="sticky top-0 z-40 bg-gray-800/95 backdrop-blur border-b border-gray-600 p-2 shadow-md shrink-0 flex flex-col gap-2">
                     {/* Deadlines Section */}
                     {deadlines.length > 0 && (
                         <div className="mb-1">
                             <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1 font-bold">
                                 <Flag size={10} fill="currentColor" /> Deadlines Due Today
                             </div>
                             <div className="flex flex-wrap gap-2">
                                 {deadlines.map(t => (
                                     <div key={t.id} onClick={() => setEditingTask(t)} className="bg-gray-700 border border-red-900/50 px-2 py-1 rounded text-xs text-red-200 flex items-center gap-1 cursor-pointer hover:bg-gray-600">
                                         <span className="w-1 h-3 bg-red-500 rounded-full"></span>
                                         <span>{t.title}</span>
                                         {t.deadlineTime && <span className="bg-red-900/50 px-1 rounded text-[10px]">{t.deadlineTime}</span>}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}

                     <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 flex justify-between">
                            <span>Unscheduled / All Day</span>
                        </div>
                        <div 
                            className="flex flex-wrap gap-2 min-h-[32px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, currentDate)}
                        >
                            {dayTasks.filter(t => !t.time).length === 0 && <span className="text-xs text-gray-600 italic px-2">No unscheduled tasks</span>}
                            {dayTasks.filter(t => !t.time).map(t => (
                                <div 
                                    key={t.id} 
                                    className="px-2 py-1 rounded border border-white/10 text-xs flex items-center gap-2 text-white cursor-pointer hover:brightness-110"
                                    style={{ backgroundColor: t.color || '#3b82f6' }}
                                    onClick={() => setEditingTask(t)}
                                >
                                    {t.title}
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>

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
                         const range = getTaskTimeRange(task.date!, task.time, task.durationMinutes);
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
                                className="absolute left-12 md:left-14 right-1 md:right-2 rounded p-1.5 md:p-2 shadow-lg z-10 overflow-hidden hover:z-20 hover:scale-[1.01] transition-all cursor-pointer border border-white/20"
                                style={{
                                    top: `${startMinutes}px`,
                                    height: `${Math.max(heightMinutes, 30)}px`,
                                    backgroundColor: task.color || '#3b82f6'
                                }}
                                onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                             >
                                 <div className="font-bold text-xs md:text-sm text-white truncate drop-shadow-md">{task.title}</div>
                                 <div className="text-[10px] md:text-xs text-white/90 flex items-center gap-1 font-medium">
                                     <Clock size={10} /> 
                                     {task.time} - {range.end.getHours().toString().padStart(2,'0')}:{range.end.getMinutes().toString().padStart(2,'0')}
                                 </div>
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

             {/* Daily Money Summary Side Panel (Desktop Only) */}
             <div className="hidden md:block w-72 bg-gray-800 rounded-xl p-5 border border-gray-600 h-fit shadow-xl">
                 <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-600 pb-2 flex items-center justify-between">
                    Daily Finance
                    <span className="text-[10px] text-gray-500">{formatDateISO(currentDate)}</span>
                 </h3>
                 
                 <div className="text-center mb-6 bg-gray-900 rounded-lg p-4 border border-gray-600">
                     <div className="text-gray-500 text-xs uppercase tracking-widest">Total Spent</div>
                     <div className="text-3xl font-bold text-white mt-2 font-mono">{formatCurrency(totalSpent)}</div>
                     <div className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${isOverBudget ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                         {isOverBudget ? `Over limit by ${formatCurrency(totalSpent - budget.daily)}` : 'Within Budget'}
                     </div>
                 </div>

                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                     {dayExpenses.length === 0 && <div className="text-xs text-center text-gray-600 py-8 italic">No expenses recorded today</div>}
                     {dayExpenses.map(e => (
                         <div key={e.id} className="flex items-center justify-between text-sm group p-2 rounded hover:bg-gray-700 transition-colors">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center text-gray-400">
                                     <DollarSign size={14} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-gray-200 font-medium truncate max-w-[100px]">{e.title}</span>
                                    <span className="text-[10px] text-gray-500">{e.category}</span>
                                 </div>
                             </div>
                             <span className="font-mono text-white font-bold">-{formatCurrency(e.amount)}</span>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
  };

  // --- TASK EDIT MODAL ---
  const renderTaskEditModal = () => {
    if (!editingTask) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-gray-800 border border-gray-600 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Edit2 size={18} className="text-blue-500"/> Edit Task
                    </h3>
                    <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Title</label>
                        <input 
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                            value={editingTask.title}
                            onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-xs text-gray-500 block mb-1">Schedule Date</label>
                            <input 
                                type="date"
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-xs"
                                value={editingTask.date || ''}
                                onChange={(e) => setEditingTask({...editingTask, date: e.target.value})}
                            />
                         </div>
                         <div>
                            <label className="text-xs text-gray-500 block mb-1">Schedule Time</label>
                            <input 
                                type="time"
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-xs"
                                value={editingTask.time || ''}
                                onChange={(e) => setEditingTask({...editingTask, time: e.target.value})}
                            />
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                             <label className="text-xs text-red-400 block mb-1 font-semibold flex items-center gap-1"><Flag size={10} /> Deadline</label>
                             <input 
                                 type="date"
                                 className="w-full bg-gray-900 border border-red-900/30 rounded px-3 py-2 text-white text-xs"
                                 value={editingTask.deadline || ''}
                                 onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value})}
                             />
                        </div>
                        <div>
                            <label className="text-xs text-red-400 block mb-1 font-semibold">Deadline Time</label>
                            <input 
                                type="time"
                                className="w-full bg-gray-900 border border-red-900/30 rounded px-3 py-2 text-white text-xs"
                                value={editingTask.deadlineTime || ''}
                                onChange={(e) => setEditingTask({...editingTask, deadlineTime: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Duration (min)</label>
                        <input 
                            type="number"
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-xs"
                            value={editingTask.durationMinutes}
                            onChange={(e) => setEditingTask({...editingTask, durationMinutes: parseInt(e.target.value)})}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {TASK_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`w-6 h-6 rounded-full border-2 ${editingTask.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setEditingTask({...editingTask, color: c})}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                         <label className="text-xs text-gray-500 block mb-1">Priority</label>
                         <select 
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-xs"
                            value={editingTask.priority}
                            onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as Priority})}
                         >
                             {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                         </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button 
                        variant="danger" 
                        className="flex-1"
                        onClick={() => {
                            onDeleteTask(editingTask.id);
                            setEditingTask(null);
                        }}
                    >
                        <Trash2 size={16} /> Delete
                    </Button>
                    <Button 
                        className="flex-[2]"
                        onClick={() => {
                            onUpdateTask(editingTask);
                            setEditingTask(null);
                        }}
                    >
                        Save Changes
                    </Button>
                </div>
             </div>
        </div>
    )
  };

  // --- DAY DETAIL MODAL (Existing, for generic day click) ---
  const renderDayDetailModal = () => {
     if (!selectedDayDetails) return null;
     const { dayTasks, dayExpenses, totalSpent, isOverBudget } = getDayStats(selectedDayDetails);
     
     return (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div 
                className="bg-gray-800 border border-gray-600 w-full max-w-sm md:max-w-md rounded-3xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
             >
                 {/* Header */}
                 <div className="p-6 bg-gradient-to-br from-gray-700 to-gray-800 border-b border-gray-600 relative shrink-0">
                     <button 
                        onClick={() => setSelectedDayDetails(null)} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                     >
                         <X size={20} />
                     </button>
                     <div className="text-3xl font-bold text-white mb-1">{selectedDayDetails.getDate()}</div>
                     <div className="text-gray-400 font-medium uppercase tracking-wider text-sm">
                         {selectedDayDetails.toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}
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
                                <div key={t.id} className="relative group cursor-pointer" onClick={() => { setSelectedDayDetails(null); setEditingTask(t); }}>
                                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-dark-900" style={{ backgroundColor: t.color || '#3b82f6' }}></div>
                                    <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">{t.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                        <span>{t.time ? t.time : 'All Day'}</span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                        <span>{t.durationMinutes}m</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     {/* Divider */}
                     <div className="h-px bg-gray-700 mx-6 my-2"></div>

                     {/* Expenses Section */}
                     <div className="p-6 pt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <DollarSign size={16} className="text-green-500" />
                                Expenses
                            </h4>
                            <span className={`text-sm font-mono font-bold ${isOverBudget ? 'text-red-400' : 'text-gray-300'}`}>
                                Total: {formatCurrency(totalSpent)}
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {dayExpenses.length === 0 && <div className="text-sm text-gray-600 italic">No expenses recorded</div>}
                            {dayExpenses.map(e => (
                                <div key={e.id} className="flex justify-between items-center text-sm bg-gray-900/50 p-2 rounded border border-gray-600/50">
                                    <span className="text-gray-300">{e.title}</span>
                                    <span className="text-white font-mono">-{formatCurrency(e.amount)}</span>
                                </div>
                            ))}
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
    <div className="flex flex-col h-full bg-gray-900 rounded-lg md:rounded-2xl border border-gray-600 overflow-hidden shadow-2xl relative">
      <div className="flex items-center justify-between mb-0 px-3 py-3 md:px-4 md:pt-4 md:pb-2 border-b border-gray-600 bg-gray-800/50 shrink-0">
        <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1 border border-gray-600">
           <Button variant="ghost" onClick={handlePrev} size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0"><ChevronLeft size={16}/></Button>
           <Button variant="ghost" onClick={() => onDateChange(new Date())} size="sm" className="h-7 md:h-8 text-xs px-2">Today</Button>
           <Button variant="ghost" onClick={handleNext} size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0"><ChevronRight size={16}/></Button>
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
