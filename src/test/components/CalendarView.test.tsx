import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarView } from '../../components/CalendarView';
import { makeExpense, makeIncome, makeSession, makeTask } from '../fixtures';

const renderCalendar = (overrides: Partial<React.ComponentProps<typeof CalendarView>> = {}) => {
  const props: React.ComponentProps<typeof CalendarView> = {
    viewMode: 'day',
    currentDate: new Date(2026, 6, 22),
    onDateChange: vi.fn(),
    tasks: [],
    expenses: [],
    incomes: [],
    onTaskSchedule: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onDeleteExpense: vi.fn(),
    onDeleteIncome: vi.fn(),
    onViewModeChange: vi.fn(),
    pomodoroSessions: [],
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

  it('opens the day overview when a date is clicked in week view', () => {
    renderCalendar({
      viewMode: 'week',
      expenses: [makeExpense({ title: '週間午餐', date: '2026-07-22' })],
    });

    fireEvent.click(screen.getByRole('button', { name: '查看 2026-07-22 當日資訊' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('週間午餐')).toBeInTheDocument();
  });

  it('shows expense and income records as matching red and green rows without inline entry forms', () => {
    renderCalendar({
      viewMode: 'month',
      expenses: [makeExpense({ title: '晚餐' })],
      incomes: [makeIncome({ title: '獎金', date: '2026-07-22' })],
    });

    fireEvent.click(screen.getByText('22'));
    expect(screen.getByText('晚餐').closest('div[class*="border-red-500"]')).toBeInTheDocument();
    expect(screen.getByText('獎金').closest('div[class*="border-emerald-500"]')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Expense title')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Income title')).not.toBeInTheDocument();
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
    expect(screen.queryByText('開始專注')).not.toBeInTheDocument();
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
