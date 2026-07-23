import { Allocation, Expense, Income, PomodoroSession, Task } from '../types';

export const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: '撰寫報告',
  isCompleted: false,
  priority: 'medium',
  durationMinutes: 30,
  color: '#3b82f6',
  ...overrides,
});

export const makeExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  title: '午餐',
  amount: 120,
  category: 'Food',
  date: '2026-07-22',
  ...overrides,
});

export const makeIncome = (overrides: Partial<Income> = {}): Income => ({
  id: 'income-1',
  title: '薪資',
  amount: 15000,
  category: 'Living',
  date: '2026-07-01',
  ...overrides,
});

export const makeAllocation = (overrides: Partial<Allocation> = {}): Allocation => ({
  id: 'allocation-1',
  category: 'Food',
  plannedAmount: 3000,
  month: '2026-07',
  ...overrides,
});

export const makeSession = (overrides: Partial<PomodoroSession> = {}): PomodoroSession => ({
  id: 'session-1',
  taskId: 'task-1',
  taskTitle: '撰寫報告',
  taskColor: '#3b82f6',
  startTime: '2026-07-22T09:00:00+08:00',
  endTime: '2026-07-22T09:25:00+08:00',
  focusSeconds: 1500,
  targetMinutes: 25,
  ...overrides,
});
