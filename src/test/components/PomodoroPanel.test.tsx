import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PomodoroPanel } from '../../components/PomodoroPanel';
import { usePomodoroTimer } from '../../usePomodoroTimer';
import { makeSession, makeTask } from '../fixtures';

interface TimerHarnessProps {
  date: Date;
  tasks: ReturnType<typeof makeTask>[];
  sessions: ReturnType<typeof makeSession>[];
  storageKey: string;
  onAddSession: (session: ReturnType<typeof makeSession>) => void;
  onDeleteSession: (id: string) => void;
  onTimerStarted?: () => void;
}

const TimerHarness = (props: TimerHarnessProps) => {
  const timer = usePomodoroTimer({
    date: props.date,
    tasks: props.tasks,
    sessions: props.sessions,
    storageKey: props.storageKey,
    onAddSession: props.onAddSession,
  });
  return (
    <PomodoroPanel
      timer={timer}
      onDeleteSession={props.onDeleteSession}
      onTimerStarted={props.onTimerStarted}
    />
  );
};

describe('PomodoroPanel', () => {
  const today = new Date(2026, 6, 23, 9, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(today);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderPanel = (overrides: Partial<TimerHarnessProps> = {}) => {
    const props: TimerHarnessProps = {
      date: today,
      tasks: [
        makeTask({ id: 'scheduled', title: '今日排程', date: '2026-07-23', time: '09:00' }),
        makeTask({ id: 'daily', title: '每日閱讀', isDaily: true }),
        makeTask({ id: 'future', title: '明日排程', date: '2026-07-24', time: '09:00' }),
      ],
      sessions: [],
      storageKey: 'pomodoro-test',
      onAddSession: vi.fn(),
      onDeleteSession: vi.fn(),
      ...overrides,
    };
    return { props, ...render(<TimerHarness {...props} />) };
  };

  it('offers only today scheduled tasks and daily tasks', () => {
    renderPanel();
    const taskSelect = screen.getByRole('combobox', { name: '選擇專注任務' });
    expect(within(taskSelect).getByRole('option', { name: '今日排程' })).toBeInTheDocument();
    expect(within(taskSelect).getByRole('option', { name: '每日 · 每日閱讀' })).toBeInTheDocument();
    expect(within(taskSelect).queryByRole('option', { name: '明日排程' })).not.toBeInTheDocument();
  });

  it('tracks active focus time while excluding paused time', () => {
    const { props } = renderPanel();
    fireEvent.change(screen.getByRole('combobox', { name: '選擇專注任務' }), {
      target: { value: 'daily' },
    });
    fireEvent.click(screen.getByRole('button', { name: /開始專注/ }));

    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(window.localStorage.getItem('pomodoro-test')).toContain('每日閱讀');

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByText('23:59')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /暫停/ }));
    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.getByText('23:59')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /完成/ }));
    expect(props.onAddSession).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 'daily',
      taskTitle: '每日閱讀',
      focusSeconds: 61,
      targetMinutes: 25,
    }));
    expect(window.localStorage.getItem('pomodoro-test')).toBeNull();
  });

  it('automatically completes a full 25-minute session', () => {
    const { props } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /開始專注/ }));

    act(() => {
      vi.advanceTimersByTime(25 * 60_000);
    });

    expect(props.onAddSession).toHaveBeenCalledTimes(1);
    expect(props.onAddSession).toHaveBeenCalledWith(expect.objectContaining({
      focusSeconds: 1500,
      targetMinutes: 25,
    }));
    expect(screen.getByRole('button', { name: /開始專注/ })).toBeInTheDocument();
  });

  it('does not save a discarded session', () => {
    const { props } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /開始專注/ }));
    fireEvent.click(screen.getByRole('button', { name: '放棄本回專注' }));

    expect(props.onAddSession).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /開始專注/ })).toBeInTheDocument();
  });

  it('notifies the global experience to minimize after starting', () => {
    const onTimerStarted = vi.fn();
    renderPanel({ onTimerStarted });
    fireEvent.click(screen.getByRole('button', { name: /開始專注/ }));
    expect(onTimerStarted).toHaveBeenCalledTimes(1);
  });

  it('shows, scrolls and deletes saved sessions', () => {
    const sessions = Array.from({ length: 8 }, (_, index) => makeSession({
      id: `session-${index}`,
      taskTitle: `專注 ${index}`,
      startTime: new Date(2026, 6, 23, 8, index).toISOString(),
      endTime: new Date(2026, 6, 23, 8, index + 1).toISOString(),
      focusSeconds: 60,
    }));
    const { props, container } = renderPanel({ sessions });

    expect(screen.getByText('8 回')).toBeInTheDocument();
    expect(container.querySelector('.max-h-44.overflow-y-auto')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '刪除 專注 0 專注紀錄' }));
    expect(props.onDeleteSession).toHaveBeenCalledWith('session-0');
  });
});
