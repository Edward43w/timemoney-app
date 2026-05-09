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
  endTime?: string; // HH:mm for task end time
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

export interface Income {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO Date string (YYYY-MM-DD)
}

export interface Allocation {
  id: string;
  category: string;
  plannedAmount: number;
  month: string; // YYYY-MM
}

export interface Budget {
  daily: number;
  weekly: number;
  monthly: number;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Education', 'Health', 'Other'
];

export const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelance', 'Allowance', 'Investment', 'Gift', 'Other'];

export const DEFAULT_ALLOCATION_CATEGORIES = [
  'Living',
  'Fixed Costs',
  'Learning',
  'Entertainment',
  'Savings',
  'Emergency Fund',
];

export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
