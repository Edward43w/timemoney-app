export type ViewMode = 'day' | 'week' | 'month';
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: Priority;
  durationMinutes: number; // Duration in minutes
  date?: string; // ISO Date string (YYYY-MM-DD) if scheduled
  time?: string; // HH:mm if scheduled
  deadline?: string; // ISO Date string (YYYY-MM-DD)
  deadlineTime?: string; // HH:mm for deadline
  color: string; // Hex color for the task block
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO Date string (YYYY-MM-DD)
}

export interface Budget {
  daily: number;
  weekly: number;
  monthly: number;
}

export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Education', 'Health', 'Other'
];

export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];