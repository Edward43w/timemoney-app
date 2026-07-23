import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FocusDashboard } from '../../components/FocusDashboard';
import { makeSession } from '../fixtures';

vi.mock('recharts', () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Wrapper,
    BarChart: Wrapper,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Bar: () => null,
  };
});

const sessions = [
  makeSession({
    id: 'wednesday',
    taskId: 'code',
    taskTitle: '寫程式',
    startTime: '2026-07-22T09:00:00+08:00',
    endTime: '2026-07-22T09:25:00+08:00',
    focusSeconds: 1500,
  }),
  makeSession({
    id: 'thursday',
    taskId: 'study',
    taskTitle: '讀書',
    startTime: '2026-07-23T10:00:00+08:00',
    endTime: '2026-07-23T10:50:00+08:00',
    focusSeconds: 3000,
    targetMinutes: 50,
  }),
  makeSession({
    id: 'earlier-month',
    taskId: 'code',
    taskTitle: '寫程式',
    startTime: '2026-07-01T08:00:00+08:00',
    endTime: '2026-07-01T08:30:00+08:00',
    focusSeconds: 1800,
  }),
];

describe('FocusDashboard', () => {
  it('summarizes focus time for the selected week', () => {
    render(
      <FocusDashboard
        sessions={sessions}
        currentDate={new Date(2026, 6, 22)}
        onDateChange={vi.fn()}
      />,
    );

    expect(screen.getByText('1 小時 15 分')).toBeInTheDocument();
    expect(screen.getByText('2 回')).toBeInTheDocument();
    expect(screen.getByText('2 天')).toBeInTheDocument();
    expect(screen.getAllByText('寫程式').length).toBeGreaterThan(0);
    expect(screen.getAllByText('讀書').length).toBeGreaterThan(0);
  });

  it('switches between week and month totals', () => {
    render(
      <FocusDashboard
        sessions={sessions}
        currentDate={new Date(2026, 6, 22)}
        onDateChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '月' }));
    expect(screen.getByText('1 小時 45 分')).toBeInTheDocument();
    expect(screen.getByText('3 回')).toBeInTheDocument();
    expect(screen.getByText('3 天')).toBeInTheDocument();
  });

  it('navigates by the active period and keeps records internally scrollable', () => {
    const onDateChange = vi.fn();
    const { container } = render(
      <FocusDashboard
        sessions={sessions}
        currentDate={new Date(2026, 6, 22)}
        onDateChange={onDateChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '下一個期間' }));
    expect(onDateChange).toHaveBeenCalledWith(new Date(2026, 6, 29));
    expect(container.querySelector('.max-h-64.overflow-y-auto')).toBeInTheDocument();
  });
});
