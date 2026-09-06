import { Priority, Recurrence, Task } from './types';

export interface TaskFormState {
  title: string;
  recurrence: Recurrence;
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

export const DEFAULT_TASK_FORM: TaskFormState = {
  title: '',
  recurrence: 'none',
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

export const QUICK_DURATIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
];

export const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

export const durationToParts = (totalMinutes: number) => {
  const safeMinutes = Math.max(0, totalMinutes);
  const durationDays = Math.floor(safeMinutes / 1440);
  const remainingAfterDays = safeMinutes % 1440;
  const durationHours = Math.floor(remainingAfterDays / 60);
  const durationMinutes = remainingAfterDays % 60;
  return { durationDays, durationHours, durationMinutes };
};

export const getDurationMinutes = (task: TaskFormState) => {
  return task.durationDays * 1440 + task.durationHours * 60 + task.durationMinutes;
};

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getEndTimeFromDuration = (startTime: string, durationMinutes: number) => {
  if (!startTime || durationMinutes <= 0) return '';
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
};

export const getDurationFromRange = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return null;
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end <= start) end += 1440;
  return end - start;
};

export const formatDuration = (minutes: number) => {
  const { durationDays, durationHours, durationMinutes } = durationToParts(minutes);
  const parts = [];
  if (durationDays) parts.push(`${durationDays}d`);
  if (durationHours) parts.push(`${durationHours}h`);
  if (durationMinutes || parts.length === 0) parts.push(`${durationMinutes}m`);
  return parts.join(' ');
};

export const taskToFormState = (task: Task): TaskFormState => ({
  title: task.title,
  recurrence: task.recurrence ?? (task.isDaily ? 'daily' : 'none'),
  ...durationToParts(task.durationMinutes),
  priority: task.priority,
  date: task.date || '',
  time: task.time || '',
  endTime: task.endTime || '',
  deadline: task.deadline || '',
  deadlineTime: task.deadlineTime || '',
});

export const formStateToTaskFields = (form: TaskFormState) => ({
  title: form.title.trim(),
  recurrence: form.recurrence === 'none' ? undefined : form.recurrence,
  isDaily: form.recurrence === 'daily',
  durationMinutes: Math.max(1, getDurationMinutes(form)),
  priority: form.priority,
  date: form.date || undefined,
  time: form.time || undefined,
  endTime: form.endTime || undefined,
  deadline: form.deadline || undefined,
  deadlineTime: form.deadlineTime || undefined,
});
