import React, { useEffect, useMemo, useState } from 'react';
import { Task, Priority } from '../types';
import { formatDateISO, getRecurrenceLabel, getTaskRecurrence } from '../utils';
import {
  DEFAULT_TASK_FORM,
  TaskFormState,
  formStateToTaskFields,
  formatDuration,
  taskToFormState,
} from '../taskFormUtils';
import {
  ArrowUpDown,
  Calendar as CalendarIcon,
  CheckSquare,
  Clock,
  Flag,
  GripVertical,
  Repeat2,
  Square,
  Trash2,
} from 'lucide-react';
import { TaskFormModal } from './TaskFormModal';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

type TaskFilter = 'all' | 'recurring' | 'scheduled' | 'unscheduled' | 'done';
type TaskSort = 'priority' | 'duration' | 'default';

const FILTER_OPTIONS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: '進行中' },
  { value: 'recurring', label: '重複' },
  { value: 'scheduled', label: '已排程' },
  { value: 'unscheduled', label: '未排程' },
  { value: 'done', label: '已完成' },
];

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'default', label: '預設' },
  { value: 'priority', label: '優先度' },
  { value: 'duration', label: '所需時間' },
];

const priorityScore: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  className,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('default');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTaskForm, setEditingTaskForm] = useState<TaskFormState>(DEFAULT_TASK_FORM);
  const [today, setToday] = useState(() => formatDateISO(new Date()));
  const isRecurring = (task: Task) => getTaskRecurrence(task) !== 'none';
  const isTaskDone = (task: Task) => isRecurring(task)
    ? task.recurrenceCompletedOn === today || task.dailyCompletedOn === today
    : task.isCompleted;

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(() => setToday(formatDateISO(new Date())), nextDay.getTime() - now.getTime() + 1000);
    return () => window.clearTimeout(timer);
  }, [today]);

  const counts = useMemo(() => {
    return {
      all: tasks.filter((task) => !isRecurring(task) && !task.isCompleted).length,
      recurring: tasks.filter(isRecurring).length,
      scheduled: tasks.filter((task) => !isRecurring(task) && !task.isCompleted && !!task.date).length,
      unscheduled: tasks.filter((task) => !isRecurring(task) && !task.isCompleted && !task.date).length,
      done: tasks.filter((task) => !isRecurring(task) && task.isCompleted).length,
    };
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => {
        if (filter === 'recurring') return isRecurring(task);
        if (isRecurring(task)) return false;
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

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEditingTaskForm(taskToFormState(task));
  };

  const handleUpdateTask = () => {
    if (!editingTask || !editingTaskForm.title.trim()) return;

    onUpdateTask({
      ...editingTask,
      ...formStateToTaskFields(editingTaskForm),
    });
    setEditingTask(null);
  };

  const handleDeleteEditingTask = () => {
    if (!editingTask) return;
    onDeleteTask(editingTask.id);
    setEditingTask(null);
  };

  const toggleComplete = (task: Task) => {
    if (isRecurring(task)) {
      const completedToday = task.recurrenceCompletedOn === today || task.dailyCompletedOn === today;
      onUpdateTask({
        ...task,
        isCompleted: false,
        recurrenceCompletedOn: completedToday ? undefined : today,
        dailyCompletedOn: undefined,
      });
      return;
    }

    onUpdateTask({ ...task, isCompleted: !task.isCompleted });
  };

  const handleDragStart = (event: React.DragEvent, task: Task) => {
    event.dataTransfer.setData('taskId', task.id);
    event.dataTransfer.setData('taskDuration', task.durationMinutes.toString());
    event.dataTransfer.effectAllowed = 'move';
    const el = event.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
  };

  const handleDragEnd = (event: React.DragEvent) => {
    const el = event.currentTarget as HTMLElement;
    el.style.opacity = '1';
  };

  return (
    <div className={`relative flex h-full min-h-0 flex-col bg-[#101318] ${className}`}>
      <div className="shrink-0 border-b border-white/[0.08] p-4">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-white">
          <CheckSquare className="text-amber-200" strokeWidth={1.8} />
          任務
        </h2>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${option.value === 'done' ? 'col-span-2' : ''} ${
                filter === option.value ? 'bg-accent text-accent-ink shadow-accent' : 'bg-white/[0.035] text-gray-500 hover:bg-white/[0.06] hover:text-gray-200'
              }`}
            >
              <span className="truncate">{option.label}</span>
              <span className="rounded bg-black/20 px-1 text-[10px]">{counts[option.value]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ArrowUpDown size={12} />
          <span>排序</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as TaskSort)}
            aria-label="任務排序方式"
            className="min-w-0 flex-1 rounded-md border border-white/[0.08] bg-[#0b0d10] px-2 py-1.5 text-white outline-none focus:border-accent/60"
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
          {sortedTasks.map((task) => {
            const taskDone = isTaskDone(task);
            return (
            <div
              key={task.id}
              draggable={!taskDone && !isRecurring(task)}
              onDragStart={(event) => handleDragStart(event, task)}
              onDragEnd={handleDragEnd}
              onClick={() => openEditTask(task)}
              className={`group relative flex gap-3 rounded-lg border p-3 transition-all ${
                taskDone
                  ? 'cursor-pointer border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/[0.12]'
                  : isRecurring(task)
                    ? 'cursor-pointer border-white/[0.07] bg-[#0c0f13] hover:border-accent/30'
                    : 'cursor-grab border-white/[0.07] bg-[#0c0f13] hover:border-accent/30 active:cursor-grabbing'
              }`}
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-lg bg-task-line" />

              {!taskDone && !isRecurring(task) && (
                <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-grab text-gray-600 opacity-0 group-hover:opacity-100">
                  <GripVertical size={14} />
                </div>
              )}

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  toggleComplete(task);
                }}
                className="ml-2 mt-1 shrink-0 pl-1 text-gray-500 hover:text-blue-500"
                aria-label={taskDone ? '標示為今天未完成' : '標示為完成'}
              >
                {taskDone ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>

              <div className="min-w-0 flex-1">
                <div className={`truncate font-medium ${taskDone ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {task.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  {isRecurring(task) && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-200/80">
                      <Repeat2 size={10} /> {getRecurrenceLabel(task)}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{task.priority}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {formatDuration(task.durationMinutes)}
                  </span>
                  {task.deadline && (
                    <span className="flex items-center gap-1 font-medium text-red-400">
                      <Flag size={10} />
                      {task.deadline}
                      {task.deadlineTime && (
                        <span className="rounded bg-red-900/30 px-1 text-[9px]">{task.deadlineTime}</span>
                      )}
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
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="self-start text-gray-600 opacity-100 transition-opacity hover:text-red-400 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>
            );
          })}

          {sortedTasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
              {filter === 'done' ? '還沒有已完成的任務。' : filter === 'recurring' ? '還沒有重複任務，可以在新增任務設定每日、每週或每月。' : '這裡還沒有任務，先新增一件今天想完成的事。'}
            </div>
          )}
        </div>
      </div>

      {editingTask && (
        <TaskFormModal
          title="編輯任務"
          description="調整任務時間、排程與截止期限。"
          value={editingTaskForm}
          onChange={setEditingTaskForm}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
          submitLabel="儲存變更"
          onDelete={handleDeleteEditingTask}
        />
      )}
    </div>
  );
};
