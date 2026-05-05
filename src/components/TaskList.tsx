import React, { useMemo, useState } from 'react';
import { Task, Priority, PRIORITIES } from '../types';
import { getRandomColor } from '../utils';
import { Button } from './Button';
import {
  CheckSquare,
  Square,
  Clock,
  Calendar as CalendarIcon,
  Trash2,
  ArrowUpCircle,
  ArrowUpDown,
  GripVertical,
  Calendar,
  Flag,
  ChevronDown,
  Plus,
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

type TaskFilter = 'all' | 'scheduled' | 'unscheduled' | 'done';
type TaskSort = 'priority' | 'duration' | 'default';

interface NewTaskState {
  title: string;
  durationDays: number;
  durationHours: number;
  durationMinutes: number;
  priority: Priority;
  date: string;
  time: string;
  endTime: string;
  deadline: string;
  deadlineTime: string;
}

const DEFAULT_TASK: NewTaskState = {
  title: '',
  durationDays: 0,
  durationHours: 0,
  durationMinutes: 30,
  priority: 'medium',
  date: '',
  time: '',
  endTime: '',
  deadline: '',
  deadlineTime: '',
};

const FILTER_OPTIONS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'unscheduled', label: 'Unscheduled' },
  { value: 'done', label: 'Done' },
];

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'priority', label: 'Priority' },
  { value: 'duration', label: 'Duration' },
];

const QUICK_DURATIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
];

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

const priorityScore: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

const durationToParts = (totalMinutes: number) => {
  const safeMinutes = Math.max(0, totalMinutes);
  const durationDays = Math.floor(safeMinutes / 1440);
  const remainingAfterDays = safeMinutes % 1440;
  const durationHours = Math.floor(remainingAfterDays / 60);
  const durationMinutes = remainingAfterDays % 60;
  return { durationDays, durationHours, durationMinutes };
};

const getDurationMinutes = (task: NewTaskState) => {
  return task.durationDays * 1440 + task.durationHours * 60 + task.durationMinutes;
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const getEndTimeFromDuration = (startTime: string, durationMinutes: number) => {
  if (!startTime || durationMinutes <= 0) return '';
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
};

const getDurationFromRange = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return null;
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end <= start) end += 1440;
  return end - start;
};

const formatDuration = (minutes: number) => {
  const { durationDays, durationHours, durationMinutes } = durationToParts(minutes);
  const parts = [];
  if (durationDays) parts.push(`${durationDays}d`);
  if (durationHours) parts.push(`${durationHours}h`);
  if (durationMinutes || parts.length === 0) parts.push(`${durationMinutes}m`);
  return parts.join(' ');
};

const TimeSelect = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full appearance-none rounded-md border border-gray-600 bg-gray-900 px-2.5 py-2 pr-8 text-xs text-white outline-none transition-colors focus:border-blue-500"
    >
      <option value="">{placeholder}</option>
      {TIME_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
  </div>
);

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  className,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('default');
  const [newTask, setNewTask] = useState<NewTaskState>(DEFAULT_TASK);
  const [showScheduleInputs, setShowScheduleInputs] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const counts = useMemo(() => {
    return {
      all: tasks.filter((task) => !task.isCompleted).length,
      scheduled: tasks.filter((task) => !task.isCompleted && !!task.date).length,
      unscheduled: tasks.filter((task) => !task.isCompleted && !task.date).length,
      done: tasks.filter((task) => task.isCompleted).length,
    };
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => {
        if (filter === 'done') return task.isCompleted;
        if (task.isCompleted) return false;
        if (filter === 'scheduled') return !!task.date;
        if (filter === 'unscheduled') return !task.date;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority' || sortBy === 'default') {
          return priorityScore[b.priority] - priorityScore[a.priority];
        }
        if (sortBy === 'duration') {
          return b.durationMinutes - a.durationMinutes;
        }
        return 0;
      });
  }, [filter, sortBy, tasks]);

  const updateDuration = (totalMinutes: number) => {
    const nextDuration = durationToParts(totalMinutes);
    setNewTask((current) => ({
      ...current,
      ...nextDuration,
      endTime: current.time ? getEndTimeFromDuration(current.time, totalMinutes) : current.endTime,
    }));
  };

  const updateDurationPart = (part: 'durationDays' | 'durationHours' | 'durationMinutes', value: number) => {
    const nextTask = { ...newTask, [part]: Math.max(0, value) };
    const totalMinutes = getDurationMinutes(nextTask);
    setNewTask({
      ...newTask,
      ...durationToParts(totalMinutes),
      endTime: nextTask.time ? getEndTimeFromDuration(nextTask.time, totalMinutes) : nextTask.endTime,
    });
  };

  const updateStartTime = (time: string) => {
    const durationMinutes = getDurationMinutes(newTask);
    setNewTask({
      ...newTask,
      time,
      endTime: time ? getEndTimeFromDuration(time, durationMinutes) : '',
    });
  };

  const updateEndTime = (endTime: string) => {
    const totalMinutes = getDurationFromRange(newTask.time, endTime);
    setNewTask({
      ...newTask,
      ...(totalMinutes === null ? {} : durationToParts(totalMinutes)),
      endTime,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTask.title.trim()) return;

    const durationMinutes = Math.max(1, getDurationMinutes(newTask));
    onAddTask({
      id: '',
      title: newTask.title.trim(),
      durationMinutes,
      priority: newTask.priority,
      isCompleted: false,
      date: newTask.date || undefined,
      time: newTask.time || undefined,
      endTime: newTask.endTime || undefined,
      deadline: newTask.deadline || undefined,
      deadlineTime: newTask.deadlineTime || undefined,
      color: getRandomColor(),
    });

    setNewTask(DEFAULT_TASK);
    setShowScheduleInputs(false);
    setShowAddTaskModal(false);
  };

  const toggleComplete = (task: Task) => {
    onUpdateTask({ ...task, isCompleted: !task.isCompleted });
  };

  const handleDragStart = (event: React.DragEvent, task: Task) => {
    event.dataTransfer.setData('taskId', task.id);
    event.dataTransfer.setData('taskDuration', task.durationMinutes.toString());
    event.dataTransfer.effectAllowed = 'move';
    const el = event.target as HTMLElement;
    el.style.opacity = '0.5';
  };

  const handleDragEnd = (event: React.DragEvent) => {
    const el = event.target as HTMLElement;
    el.style.opacity = '1';
  };

  const currentDuration = getDurationMinutes(newTask);

  return (
    <div className={`relative flex h-full min-h-0 flex-col border-l border-gray-700 bg-gray-800 ${className}`}>
      <div className="shrink-0 border-b border-gray-700 p-4">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <CheckSquare className="text-blue-500" />
          To-Do List
        </h2>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${
                filter === option.value ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="truncate">{option.label}</span>
              <span className="rounded bg-black/20 px-1 text-[10px]">{counts[option.value]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ArrowUpDown size={12} />
          <span>Sort</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as TaskSort)}
            className="min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-white outline-none focus:border-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              draggable={!task.isCompleted}
              onDragStart={(event) => handleDragStart(event, task)}
              onDragEnd={handleDragEnd}
              className={`group relative flex gap-3 rounded-lg border p-3 transition-all ${
                task.isCompleted
                  ? 'border-gray-700 bg-gray-900/60 text-gray-500'
                  : 'cursor-grab border-gray-700 bg-gray-900 hover:border-blue-500/50 active:cursor-grabbing'
              }`}
            >
              <div
                className="absolute bottom-0 left-0 top-0 w-1 rounded-l-lg"
                style={{ backgroundColor: task.color || '#3b82f6' }}
              />

              {!task.isCompleted && (
                <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-grab text-gray-600 opacity-0 group-hover:opacity-100">
                  <GripVertical size={14} />
                </div>
              )}

              <button
                onClick={() => toggleComplete(task)}
                className="ml-2 mt-1 shrink-0 pl-1 text-gray-500 hover:text-blue-500"
                aria-label={task.isCompleted ? 'Mark as active' : 'Mark as done'}
              >
                {task.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>

              <div className="min-w-0 flex-1">
                <div className={`truncate font-medium ${task.isCompleted ? 'line-through' : 'text-gray-200'}`}>
                  {task.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{task.priority}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {formatDuration(task.durationMinutes)}
                  </span>
                  {task.deadline && (
                    <span className="flex items-center gap-1 font-medium text-red-400">
                      <Flag size={10} />
                      {task.deadline}
                      {task.deadlineTime && <span className="rounded bg-red-900/30 px-1 text-[9px]">{task.deadlineTime}</span>}
                    </span>
                  )}
                </div>
                {task.date && (
                  <div className="mt-1 flex w-fit items-center gap-1 rounded bg-blue-900/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                    <CalendarIcon size={10} />
                    {task.date}
                    {task.time && (
                      <span>
                        {task.time}
                        {task.endTime && ` - ${task.endTime}`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => onDeleteTask(task.id)}
                className="self-start text-gray-600 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {sortedTasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
              {filter === 'done' ? 'No completed tasks.' : 'No active tasks here.'}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAddTaskModal(true)}
        className="absolute bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-950/50 transition-colors hover:bg-blue-500"
        aria-label="Add task"
      >
        <Plus size={24} />
      </button>

      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-700 bg-gray-800 p-4 shadow-2xl md:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">New Task</h3>
                <p className="text-xs text-gray-500">Set duration first, then schedule when needed.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                Close
              </button>
            </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="New task..."
            className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-blue-500"
            value={newTask.title}
            onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
          />
          <Button type="submit" size="sm" className="h-9 w-9 p-0" aria-label="Add task">
            <ArrowUpCircle size={18} />
          </Button>
        </div>

        <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
          <select
            className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-2 text-xs font-semibold text-white outline-none focus:border-blue-500"
            value={newTask.priority}
            onChange={(event) => setNewTask({ ...newTask, priority: event.target.value as Priority })}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowScheduleInputs(!showScheduleInputs)}
            className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300 hover:text-white"
          >
            {showScheduleInputs ? 'Hide' : 'Details'}
            <Plus size={14} />
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-gray-700 bg-gray-900/60 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-300">Duration</span>
            <span className="text-gray-500">{formatDuration(currentDuration)}</span>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {QUICK_DURATIONS.map((duration) => (
              <button
                type="button"
                key={duration.label}
                onClick={() => updateDuration(duration.minutes)}
                className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                  currentDuration === duration.minutes ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {duration.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="space-y-1 text-gray-500">
              <span>Days</span>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-white outline-none focus:border-blue-500"
                value={newTask.durationDays}
                onChange={(event) => updateDurationPart('durationDays', Number(event.target.value))}
              />
            </label>
            <label className="space-y-1 text-gray-500">
              <span>Hours</span>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-white outline-none focus:border-blue-500"
                value={newTask.durationHours}
                onChange={(event) => updateDurationPart('durationHours', Number(event.target.value))}
              />
            </label>
            <label className="space-y-1 text-gray-500">
              <span>Minutes</span>
              <input
                type="number"
                min="0"
                step="5"
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-white outline-none focus:border-blue-500"
                value={newTask.durationMinutes}
                onChange={(event) => updateDurationPart('durationMinutes', Number(event.target.value))}
              />
            </label>
          </div>
        </div>

        {showScheduleInputs && (
          <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-3">
            <div>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-300">
                <Calendar size={12} /> Schedule
              </h4>
              <div className="space-y-2">
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500"
                  value={newTask.date}
                  onChange={(event) => setNewTask({ ...newTask, date: event.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <TimeSelect value={newTask.time} onChange={updateStartTime} placeholder="Start" />
                  <TimeSelect value={newTask.endTime} onChange={updateEndTime} placeholder="End" />
                </div>
                {newTask.time && newTask.endTime && (
                  <p className="text-[11px] text-gray-500">
                    Range synced with duration: {newTask.time} - {newTask.endTime}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-red-400">
                <Flag size={12} /> Deadline
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="rounded-md border border-gray-700 bg-gray-900 px-2.5 py-2 text-xs text-white outline-none focus:border-red-500"
                  value={newTask.deadline}
                  onChange={(event) => setNewTask({ ...newTask, deadline: event.target.value })}
                />
                <TimeSelect
                  value={newTask.deadlineTime}
                  onChange={(deadlineTime) => setNewTask({ ...newTask, deadlineTime })}
                  placeholder="Due time"
                />
              </div>
            </div>
          </div>
        )}
      </form>
          </div>
        </div>
      )}
    </div>
  );
};
