import React, { useState } from 'react';
import { Task, Priority, PRIORITIES } from '../types';
import { generateId, formatDateISO, getRandomColor } from '../utils';
import { Button } from './Button';
import { CheckSquare, Square, Clock, Calendar as CalendarIcon, Filter, Trash2, ArrowUpCircle, ArrowUpDown, GripVertical, Calendar, Flag } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  className
}) => {
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'unscheduled'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'duration' | 'default'>('default');
  
  // Enhanced Form State
  const [newTask, setNewTask] = useState({ 
      title: '', 
      duration: 30, 
      priority: 'medium' as Priority,
      date: '',
      time: '',
      deadline: '',
      deadlineTime: ''
  });
  const [showScheduleInputs, setShowScheduleInputs] = useState(false);

  // Sorting Logic
  const sortedTasks = [...tasks]
    .filter(t => {
      if (filter === 'scheduled') return !!t.date;
      if (filter === 'unscheduled') return !t.date;
      return true;
    })
    .sort((a, b) => {
       // Always move completed to bottom
       if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

       if (sortBy === 'priority') {
          const prioScore = { high: 3, medium: 2, low: 1 };
          return prioScore[b.priority] - prioScore[a.priority];
       }
       if (sortBy === 'duration') {
          return b.durationMinutes - a.durationMinutes;
       }
       
       // Default: High priority first, then creation order (mocked by index stability)
       const prioScore = { high: 3, medium: 2, low: 1 };
       return prioScore[b.priority] - prioScore[a.priority];
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    // 創建不包含 ID 的任務物件（Firebase 會自動生成 ID）
    const taskData = {
      id: '', // 這會被 Firebase 忽略
      title: newTask.title,
      durationMinutes: newTask.duration,
      priority: newTask.priority,
      isCompleted: false,
      date: newTask.date || undefined,
      time: newTask.time || undefined,
      deadline: newTask.deadline || undefined,
      deadlineTime: newTask.deadlineTime || undefined,
      color: getRandomColor()
    };
    
    console.log('Creating task:', taskData); // Debug log
    onAddTask(taskData);
    
    // Reset form
    setNewTask({ title: '', duration: 30, priority: 'medium', date: '', time: '', deadline: '', deadlineTime: '' });
    setShowScheduleInputs(false);
  };

  const toggleComplete = (task: Task) => {
    onUpdateTask({ ...task, isCompleted: !task.isCompleted });
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('taskDuration', task.durationMinutes.toString());
    e.dataTransfer.effectAllowed = 'move';
    const el = e.target as HTMLElement;
    el.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.target as HTMLElement;
    el.style.opacity = '1';
  };

  return (
    <div className={`flex flex-col h-full bg-gray-800 border-l border-gray-600 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-600 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
           <CheckSquare className="text-blue-500" />
           To-Do List
        </h2>
        
        {/* Filters */}
        <div className="flex gap-2 text-xs overflow-x-auto pb-1">
          {['all', 'scheduled', 'unscheduled'].map(f => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-2 py-1 rounded capitalize whitespace-nowrap ${filter === f ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               {f}
             </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ArrowUpDown size={12} />
          <span>Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white outline-none"
          >
            <option value="default">Default</option>
            <option value="priority">Priority (High first)</option>
            <option value="duration">Duration (Long first)</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedTasks.map(task => (
          <div 
            key={task.id}
            draggable={!task.isCompleted}
            onDragStart={(e) => handleDragStart(e, task)}
            onDragEnd={handleDragEnd}
            className={`group p-3 rounded-lg border flex gap-3 relative transition-all cursor-grab active:cursor-grabbing
              ${task.isCompleted 
                ? 'border-gray-600 bg-gray-900/50 opacity-60' 
                : 'border-gray-600 bg-gray-900 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5'
              }`}
          >
            <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
                style={{ backgroundColor: task.color || '#3b82f6' }}
            ></div>

            {/* Drag Handle */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab z-10">
              <GripVertical size={14} />
            </div>

            <button onClick={() => toggleComplete(task)} className="mt-1 ml-2 text-gray-500 hover:text-blue-500 shrink-0 pl-1">
              {task.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                {task.title}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="capitalize font-bold tracking-wider text-[10px] text-gray-400">
                  {task.priority}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {task.durationMinutes}m
                </span>
                {task.deadline && (
                    <span className="flex items-center gap-1 text-red-400 font-medium" title={task.deadlineTime ? `Due at ${task.deadlineTime}` : 'Deadline'}>
                        <Flag size={10} /> 
                        {task.deadline}
                        {task.deadlineTime && <span className="text-[9px] bg-red-900/30 px-1 rounded">{task.deadlineTime}</span>}
                    </span>
                )}
              </div>
              {task.date && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded w-fit">
                  <CalendarIcon size={10} /> {task.date} {task.time}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-opacity self-start"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {sortedTasks.length === 0 && (
            <div className="text-center text-gray-600 text-sm mt-10">
                No tasks found.
            </div>
        )}
      </div>

      {/* Add Task Form */}
      <div className="p-4 border-t border-gray-600 bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="New Task..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none transition-colors"
            value={newTask.title}
            onChange={e => setNewTask({...newTask, title: e.target.value})}
          />
          
          <div className="flex items-center justify-between text-xs text-gray-400">
              <button 
                type="button" 
                onClick={() => setShowScheduleInputs(!showScheduleInputs)}
                className="flex items-center gap-1 hover:text-blue-400"
              >
                  <Calendar size={14} /> 
                  {showScheduleInputs ? 'Hide Details' : 'Add Details (Date/Deadline)'}
              </button>
          </div>

          {showScheduleInputs && (
             <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 p-2 bg-gray-900/50 rounded border border-gray-600">
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500">Scheduled Date</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                            value={newTask.date}
                            onChange={e => setNewTask({...newTask, date: e.target.value})}
                        />
                    </div>
                    <div>
                         <label className="text-[10px] text-gray-500">Time</label>
                         <input 
                            type="time"
                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                            value={newTask.time}
                            onChange={e => setNewTask({...newTask, time: e.target.value})}
                         />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-[10px] text-red-400 flex items-center gap-1"><Flag size={10} /> Deadline Date</label>
                        <input 
                           type="date"
                           className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                           value={newTask.deadline}
                           onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] text-red-400">Deadline Time</label>
                        <input 
                           type="time"
                           className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                           value={newTask.deadlineTime}
                           onChange={e => setNewTask({...newTask, deadlineTime: e.target.value})}
                        />
                     </div>
                 </div>
             </div>
          )}

          <div className="flex gap-2">
            <select
               className="bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white outline-none flex-1 focus:border-blue-600"
               value={newTask.priority}
               onChange={e => setNewTask({...newTask, priority: e.target.value as Priority})}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
            <div className="relative flex items-center w-24">
                <input
                type="number"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-2 pr-6 py-2 text-xs text-white outline-none focus:border-blue-600"
                value={newTask.duration}
                onChange={e => setNewTask({...newTask, duration: parseInt(e.target.value)})}
                placeholder="30"
                />
                <span className="absolute right-2 text-[10px] text-gray-500">min</span>
            </div>
            
            <Button type="submit" size="sm" className="px-3">
               <ArrowUpCircle size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
