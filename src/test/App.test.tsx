import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { makeTask } from './fixtures';

const authMocks = vi.hoisted(() => ({
  onAuthChange: vi.fn(),
  signOut: vi.fn(),
}));

const firebaseMocks = vi.hoisted(() => ({
  subscribeToTasks: vi.fn(),
  subscribeToExpenses: vi.fn(),
  subscribeToIncomes: vi.fn(),
  subscribeToAllocations: vi.fn(),
  subscribeToExpenseCategories: vi.fn(),
  subscribeToPomodoroSessions: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  addExpense: vi.fn(),
  deleteExpense: vi.fn(),
  addIncome: vi.fn(),
  deleteIncome: vi.fn(),
  addAllocation: vi.fn(),
  updateAllocation: vi.fn(),
  deleteAllocation: vi.fn(),
  updateExpenseCategories: vi.fn(),
  addPomodoroSession: vi.fn(),
  deletePomodoroSession: vi.fn(),
}));

vi.mock('../authService', () => authMocks);
vi.mock('../firebaseService', () => firebaseMocks);
vi.mock('../components/TaskList', () => ({
  TaskList: () => <div data-testid="task-list">任務清單</div>,
}));
vi.mock('../components/CalendarView', () => ({
  CalendarView: () => <div data-testid="calendar-view">行事曆內容</div>,
}));
vi.mock('../components/FinanceDashboard', () => ({
  FinanceDashboard: () => <div data-testid="finance-view">財務內容</div>,
}));
vi.mock('../components/FocusDashboard', () => ({
  FocusDashboard: () => <div data-testid="focus-view">專注內容</div>,
}));
vi.mock('../components/LoginPage', () => ({
  LoginPage: () => <div data-testid="login-page">登入頁面</div>,
}));

const user = {
  uid: 'user-1',
  email: 'tester@example.com',
} as User;

const subscriptionNames = [
  'subscribeToTasks',
  'subscribeToExpenses',
  'subscribeToIncomes',
  'subscribeToAllocations',
  'subscribeToExpenseCategories',
  'subscribeToPomodoroSessions',
] as const;

describe('App wiring', () => {
  beforeEach(() => {
    authMocks.onAuthChange.mockImplementation((callback: (value: User | null) => void) => {
      callback(user);
      return vi.fn();
    });
    authMocks.signOut.mockResolvedValue(undefined);

    subscriptionNames.forEach((name) => {
      firebaseMocks[name].mockImplementation((callback: (value: never[]) => void) => {
        callback([]);
        return vi.fn();
      });
    });
  });

  it('subscribes to user data and opens the calendar by default', async () => {
    render(<App />);
    expect(await screen.findByTestId('calendar-view')).toBeInTheDocument();
    expect(screen.getByText('tester@example.com')).toBeInTheDocument();
    subscriptionNames.forEach((name) => {
      expect(firebaseMocks[name]).toHaveBeenCalledTimes(1);
    });
  });

  it('switches between calendar, finance and focus dashboards', async () => {
    render(<App />);
    await screen.findByTestId('calendar-view');

    fireEvent.click(screen.getByRole('button', { name: /財務/ }));
    expect(screen.getByLabelText('正在載入頁面')).toBeInTheDocument();
    expect(await screen.findByTestId('finance-view')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /專注/ }));
    expect(await screen.findByTestId('focus-view')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /行事曆/ }));
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('signs the current user out', async () => {
    render(<App />);
    await screen.findByTestId('calendar-view');
    fireEvent.click(screen.getByRole('button', { name: '登出' }));
    await waitFor(() => expect(authMocks.signOut).toHaveBeenCalledTimes(1));
  });

  it('opens one shared income and expense form from the global money button', async () => {
    render(<App />);
    await screen.findByTestId('calendar-view');
    fireEvent.click(screen.getByRole('button', { name: '展開快速操作' }));
    fireEvent.click(screen.getByRole('button', { name: '新增收支' }));
    expect(screen.getByRole('dialog', { name: '新增收支' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '支出' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收入' })).toBeInTheDocument();
  });

  it('opens task and focus tools from the global quick action menu', async () => {
    firebaseMocks.subscribeToTasks.mockImplementation((callback: (value: ReturnType<typeof makeTask>[]) => void) => {
      callback([makeTask({ id: 'daily-focus', title: '每日閱讀', isDaily: true })]);
      return vi.fn();
    });
    render(<App />);
    await screen.findByTestId('calendar-view');

    fireEvent.click(screen.getByRole('button', { name: '展開快速操作' }));
    fireEvent.click(screen.getAllByRole('button', { name: '新增任務' }).at(-1)!);
    expect(screen.getByRole('dialog', { name: '新增任務' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: '任務名稱' }), {
      target: { value: '閱讀英文' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: '新增任務' }).at(-1)!);
    await waitFor(() => expect(firebaseMocks.addTask).toHaveBeenCalledWith(expect.objectContaining({
      title: '閱讀英文',
      durationMinutes: 30,
      isCompleted: false,
    })));

    fireEvent.click(screen.getByRole('button', { name: '展開快速操作' }));
    fireEvent.click(screen.getByRole('button', { name: '開始專注' }));
    expect(screen.getByRole('dialog', { name: '專注計時器' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /開始專注/ }));
    expect(screen.queryByRole('dialog', { name: '專注計時器' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('進行中的專注：每日閱讀')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '暫停專注' }));
    expect(screen.getByText('已暫停')).toBeInTheDocument();
  });

  it('shows the login page when there is no authenticated user', async () => {
    authMocks.onAuthChange.mockImplementation((callback: (value: User | null) => void) => {
      callback(null);
      return vi.fn();
    });
    render(<App />);
    expect(await screen.findByTestId('login-page')).toBeInTheDocument();
    subscriptionNames.forEach((name) => {
      expect(firebaseMocks[name]).not.toHaveBeenCalled();
    });
  });
});
