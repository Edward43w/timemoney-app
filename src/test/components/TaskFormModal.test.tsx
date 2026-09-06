import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskFormModal } from '../../components/TaskFormModal';
import { DEFAULT_TASK_FORM, TaskFormState } from '../../taskFormUtils';

const Harness = ({ onSubmit }: { onSubmit: () => void }) => {
  const [value, setValue] = useState<TaskFormState>(DEFAULT_TASK_FORM);
  return (
    <TaskFormModal
      title="新增任務"
      value={value}
      onChange={setValue}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      submitLabel="新增任務"
    />
  );
};

describe('TaskFormModal recurrence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 23, 10, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('supports daily, weekly and monthly rules and requires a fixed weekly time', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: '每日' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '每週' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '每月' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('任務名稱'), { target: { value: '每週回顧' } });
    fireEvent.click(screen.getByRole('button', { name: '每週' }));
    expect(screen.getByLabelText('首次日期')).toHaveValue('2026-07-23');
    expect(screen.getByText('每週與每月重複需要首次日期和開始時間。')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '新增任務' })[0]).toBeDisabled();

    fireEvent.change(screen.getByLabelText('開始時間'), { target: { value: '09:00' } });
    fireEvent.click(screen.getAllByRole('button', { name: '新增任務' })[0]);
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
