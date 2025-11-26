import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- Colors ---
export const TASK_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
];

export const getRandomColor = () => {
  return TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)];
};

// Date Helpers

// Fix: Use local time construction to avoid UTC shifts causing "off by one day" errors
export const formatDateISO = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(d.setDate(diff));
};

export const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Pad start
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  // Days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
};

// --- Multi-day & Time Logic ---

export const getTaskTimeRange = (dateStr: string, timeStr: string, durationMinutes: number) => {
    if (!dateStr) return null;
    
    // Construct Start Date
    const start = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
    
    // Construct End Date
    const end = new Date(start.getTime() + durationMinutes * 60000);

    return { start, end };
};

export const isTaskVisibleOnDate = (task: { date?: string, time?: string, durationMinutes: number }, targetDate: Date) => {
    if (!task.date) return false;

    // Normalize target date to midnight 00:00 - 23:59
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const range = getTaskTimeRange(task.date, task.time || '00:00', task.durationMinutes);
    if (!range) return false;

    // Check overlap: TaskStart < DayEnd AND TaskEnd > DayStart
    return range.start < dayEnd && range.end > dayStart;
};

export const getMinutesFromMidnight = (date: Date) => {
    return date.getHours() * 60 + date.getMinutes();
};