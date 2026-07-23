import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarView } from '../../components/CalendarView';
import { makeAllocation, makeSession, makeTask } from '../fixtures';

vi.mock('../../components/PomodoroPanel', () => ({
  PomodoroPanel: () => <div data-testid="pomodoro-panel">番茄鐘面板</div>,
}));

const renderCalendar = (overrides: Partial<React.ComponentProps<typeof CalendarView>> = {}) => {
  const props: React.ComponentProps<typeof CalendarView> = {
    viewMode: 'day',
    currentDate: new Date(2026, 6, 22),
    onDateChange: vi.fn(),
    tasks: [],
    expenses: [],
    incomes: [],
    allocations: [
      makeAllocation({ category: 'Food' }),
      makeAllocation({ id: 'living', category: 'Living' }),
    ],
    expenseCategories: ['Legacy category'],
    onUpdateExpenseCategories: vi.fn(),
    onTaskSchedule: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onDeleteExpense: vi.fn(),
    onDeleteIncome: vi.fn(),
    onAddExpense: vi.fn(),
    onAddIncome: vi.fn(),
    onViewModeChange: vi.fn(),
    pomodoroSessions: [],
    pomodoroStorageKey: 'calendar-pomodoro',
    onAddPomodoroSession: vi.fn(),
    onDeletePomodoroSession: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<CalendarView {...props} />) };
};

describe('CalendarView', () => {
  it('shows the day in the day-view heading and removes an empty unscheduled strip', () => {
    renderCalendar();
    expect(screen.getByRole('heading', { name: '2026年7月22日' })).toBeInTheDocument();
    expect(screen.queryByText(/Unscheduled/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No unscheduled tasks/i)).not.toBeInTheDocument();
  });

  it('shows actionable unscheduled tasks and translated deadlines', () => {
    renderCalendar({
      tasks: [
        makeTask({ id: 'all-day', title: '尚未排時間', date: '2026-07-22' }),
        makeTask({ id: 'deadline', title: '今天截止', deadline: '2026-07-22' }),
      ],
    });
    expect(screen.getByText('尚未排時間')).toBeInTheDocument();
    expect(screen.getByText('今日截止')).toBeInTheDocument();
    expect(screen.queryByText(/Unscheduled/i)).not.toBeInTheDocument();
  });

  it('navigates one day at a time and switches view modes', () => {
    const { props } = renderCalendar();
    fireEvent.click(screen.getByRole('button', { name: '下一個期間' }));
    expect(props.onDateChange).toHaveBeenCalledWith(new Date(2026, 6, 23));

    fireEvent.click(screen.getByRole('button', { name: '月' }));
    expect(props.onViewModeChange).toHaveBeenCalledWith('month');
  });

  it('keeps week and month headings at year and month granularity', () => {
    renderCalendar({ viewMode: 'month' });
    expect(screen.getByRole('heading', { name: '2026年7月' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '2026年7月22日' })).not.toBeInTheDocument();
  });

  it('uses the selected month budget categories in quick expense entry', () => {
    const { props } = renderCalendar();
    fireEvent.click(screen.getByRole('button', { name: 'Log expense' }));
    const dialog = screen.getByRole('dialog', { name: '新增支出' });
    const category = within(dialog).getByRole('combobox');
    expect(within(category).getByRole('option', { name: 'Food' })).toBeInTheDocument();
    expect(within(category).getByRole('option', { name: 'Living' })).toBeInTheDocument();
    expect(within(category).queryByRole('option', { name: 'Legacy category' })).not.toBeInTheDocument();

    fireEvent.change(within(dialog).getByPlaceholderText('例如：午餐'), {
      target: { value: '咖啡' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), {
      target: { value: '80' },
    });
    fireEvent.change(category, { target: { value: 'Living' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '新增支出' }));
    expect(props.onAddExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: '咖啡',
      amount: 80,
      category: 'Living',
    }));
  });

  it('renders completed focus sessions on the actual day timeline', () => {
    renderCalendar({
      pomodoroSessions: [makeSession({
        taskTitle: '實作功能',
        startTime: '2026-07-22T09:00:00+08:00',
        endTime: '2026-07-22T09:25:00+08:00',
      })],
    });
    expect(screen.getByText('實際 · 實作功能')).toBeInTheDocument();
  });

  it('schedules a dragged task into a day-view hour', () => {
    const { props } = renderCalendar({
      tasks: [makeTask({ id: 'drag-me', title: '拖曳任務' })],
    });
    fireEvent.drop(screen.getByText('09:00'), {
      dataTransfer: {
        getData: (key: string) => key === 'taskId' ? 'drag-me' : '',
      },
    });
    expect(props.onTaskSchedule).toHaveBeenCalledWith('drag-me', '2026-07-22', '09:00');
  });
});
