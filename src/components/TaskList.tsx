import React, { useMemo, useState } from 'react';
import { Task, Priority } from '../types';
import { getRandomColor } from '../utils';
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
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import { TaskFormModal } from './TaskFormModal';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

type TaskFilter = 'all' | 'scheduled' | 'unscheduled' | 'done';
type TaskSort = 'priority' | 'duration' | 'default';

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

const priorityScore: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  className,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('default');
  const [newTask, setNewTask] = useState<TaskFormState>(DEFAULT_TASK_FORM);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTaskForm, setEditingTaskForm] = useState<TaskFormState>(DEFAULT_TASK_FORM);
  const [editingColor, setEditingColor] = useState('#3b82f6');

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

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEditingTaskForm(taskToFormState(task));
    setEditingColor(task.color || '#3b82f6');
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    onAddTask({
      id: '',
      ...formStateToTaskFields(newTask),
      isCompleted: false,
      color: getRandomColor(),
    });

    setNewTask(DEFAULT_TASK_FORM);
    setShowAddTaskModal(false);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !editingTaskForm.title.trim()) return;

    onUpdateTask({
      ...editingTask,
      ...formStateToTaskFields(editingTaskForm),
      color: editingColor,
    });
    setEditingTask(null);
  };

  const handleDeleteEditingTask = () => {
    if (!editingTask) return;
    onDeleteTask(editingTask.id);
    setEditingTask(null);
  };

  const toggleComplete = (task: Task) => {
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
              onClick={() => openEditTask(task)}
              className={`group relative flex gap-3 rounded-lg border p-3 transition-all ${
                task.isCompleted
                  ? 'cursor-pointer border-gray-700 bg-gray-900/60 text-gray-500 hover:border-gray-600'
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
                onClick={(event) => {
                  event.stopPropagation();
                  toggleComplete(task);
                }}
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
        <TaskFormModal
          title="New Task"
          description="Set duration first, then schedule when needed."
          value={newTask}
          onChange={setNewTask}
          onClose={() => setShowAddTaskModal(false)}
          onSubmit={handleAddTask}
          submitLabel="Add Task"
        />
      )}

      {editingTask && (
        <TaskFormModal
          title="Edit Task"
          description="This uses the same duration and time controls as new tasks."
          value={editingTaskForm}
          onChange={setEditingTaskForm}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
          submitLabel="Save Changes"
          color={editingColor}
          onColorChange={setEditingColor}
          onDelete={handleDeleteEditingTask}
        />
      )}
    </div>
  );
};
