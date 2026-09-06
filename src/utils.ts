import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Recurrence } from './types';

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

export const DEFAULT_TASK_COLOR = '#304a60';

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

interface SchedulableTask {
    date?: string;
    time?: string;
    durationMinutes: number;
    isDaily?: boolean;
    recurrence?: Exclude<Recurrence, 'none'>;
}

export const getTaskRecurrence = (task: Pick<SchedulableTask, 'isDaily' | 'recurrence'>): Recurrence => (
    task.recurrence ?? (task.isDaily ? 'daily' : 'none')
);

export const getRecurrenceLabel = (task: Pick<SchedulableTask, 'isDaily' | 'recurrence'>) => ({
    none: '',
    daily: '每日',
    weekly: '每週',
    monthly: '每月',
}[getTaskRecurrence(task)]);

const calendarDayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;

const isOccurrenceDate = (task: SchedulableTask, candidate: Date) => {
    const recurrence = getTaskRecurrence(task);
    if (recurrence === 'none') return Boolean(task.date) && formatDateISO(candidate) === task.date;

    if (!task.date) return recurrence === 'daily';
    const anchor = new Date(`${task.date}T00:00:00`);
    const dayDifference = calendarDayNumber(candidate) - calendarDayNumber(anchor);
    if (dayDifference < 0) return false;
    if (recurrence === 'daily') return true;
    if (recurrence === 'weekly') return dayDifference % 7 === 0;

    const monthDifference = (candidate.getFullYear() - anchor.getFullYear()) * 12
        + candidate.getMonth() - anchor.getMonth();
    return monthDifference >= 0 && candidate.getDate() === anchor.getDate();
};

export const getTaskTimeRangeForDate = (task: SchedulableTask, targetDate: Date) => {
    const recurrence = getTaskRecurrence(task);
    if (recurrence === 'none') {
        if (!task.date) return null;
        return getTaskTimeRange(task.date, task.time || '00:00', task.durationMinutes);
    }

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    const lookbackDays = Math.ceil(task.durationMinutes / 1440) + 1;

    for (let offset = 0; offset <= lookbackDays; offset += 1) {
        const candidate = new Date(dayStart);
        candidate.setDate(candidate.getDate() - offset);
        if (!isOccurrenceDate(task, candidate)) continue;
        const range = getTaskTimeRange(formatDateISO(candidate), task.time || '00:00', task.durationMinutes);
        if (range && range.start < dayEnd && range.end > dayStart) return range;
    }
    return null;
};

export const isTaskVisibleOnDate = (task: SchedulableTask, targetDate: Date) => {
    const range = getTaskTimeRangeForDate(task, targetDate);
    if (!range) return false;

    // Normalize target date to midnight 00:00 - 23:59
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Check overlap: TaskStart < DayEnd AND TaskEnd > DayStart
    return range.start < dayEnd && range.end > dayStart;
};

export const getMinutesFromMidnight = (date: Date) => {
    return date.getHours() * 60 + date.getMinutes();
};
