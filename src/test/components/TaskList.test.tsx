import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskList } from '../../components/TaskList';
import { makeTask } from '../fixtures';

describe('TaskList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 23, 10, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filters scheduled, unscheduled, recurring and completed tasks', () => {
    render(
      <TaskList
        tasks={[
          makeTask({ id: 'scheduled', title: '已排工作', date: '2026-07-23' }),
          makeTask({ id: 'unscheduled', title: '待安排工作' }),
          makeTask({ id: 'daily', title: '每日整理', isDaily: true }),
          makeTask({ id: 'weekly', title: '每週檢視', recurrence: 'weekly', date: '2026-07-23', time: '09:00' }),
          makeTask({ id: 'done', title: '已完成工作', isCompleted: true }),
        ]}
        onUpdateTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    expect(screen.getByText('已排工作')).toBeInTheDocument();
    expect(screen.getByText('待安排工作')).toBeInTheDocument();
    expect(screen.queryByText('每日整理')).not.toBeInTheDocument();
    expect(screen.queryByText('已完成工作')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /重複2/ }));
    expect(screen.getByText('每日整理')).toBeInTheDocument();
    expect(screen.getByText('每週檢視')).toBeInTheDocument();
    expect(screen.getByText('每週')).toBeInTheDocument();
    expect(screen.queryByText('已排工作')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /已完成1/ }));
    expect(screen.getByText('已完成工作')).toBeInTheDocument();
  });

  it('marks a recurring task complete only for today', () => {
    const onUpdateTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: 'daily', title: '每日整理', isDaily: true })]}
        onUpdateTask={onUpdateTask}
        onDeleteTask={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /重複1/ }));
    fireEvent.click(screen.getByRole('button', { name: '標示為完成' }));

    expect(onUpdateTask).toHaveBeenCalledWith(expect.objectContaining({
      id: 'daily',
      isCompleted: false,
      recurrenceCompletedOn: '2026-07-23',
      dailyCompletedOn: undefined,
    }));
  });

  it('toggles a normal task permanently complete', () => {
    const onUpdateTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: 'normal', title: '一般任務' })]}
        onUpdateTask={onUpdateTask}
        onDeleteTask={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '標示為完成' }));
    expect(onUpdateTask).toHaveBeenCalledWith(expect.objectContaining({
      id: 'normal',
      isCompleted: true,
    }));
  });

  it('deletes a task from its edit dialog', () => {
    const onDeleteTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: 'delete-me', title: '刪除我' })]}
        onUpdateTask={vi.fn()}
        onDeleteTask={onDeleteTask}
      />,
    );

    fireEvent.click(screen.getByText('刪除我'));
    fireEvent.click(screen.getByRole('button', { name: /刪除$/ }));
    expect(onDeleteTask).toHaveBeenCalledWith('delete-me');
  });
});
