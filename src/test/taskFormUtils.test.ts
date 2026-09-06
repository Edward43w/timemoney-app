import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TASK_FORM,
  durationToParts,
  formStateToTaskFields,
  formatDuration,
  getDurationFromRange,
  getDurationMinutes,
  getEndTimeFromDuration,
  minutesToTime,
  taskToFormState,
  timeToMinutes,
} from '../taskFormUtils';
import { makeTask } from './fixtures';

describe('task form utilities', () => {
  it('splits and recombines multi-day durations', () => {
    expect(durationToParts(1595)).toEqual({
      durationDays: 1,
      durationHours: 2,
      durationMinutes: 35,
    });
    expect(getDurationMinutes({ ...DEFAULT_TASK_FORM, ...durationToParts(1595) })).toBe(1595);
  });

  it('converts between time strings and minutes', () => {
    expect(timeToMinutes('09:45')).toBe(585);
    expect(minutesToTime(1500)).toBe('01:00');
    expect(minutesToTime(-30)).toBe('23:30');
  });

  it('calculates an end time across midnight', () => {
    expect(getEndTimeFromDuration('23:30', 90)).toBe('01:00');
    expect(getEndTimeFromDuration('', 30)).toBe('');
  });

  it('calculates duration from an overnight time range', () => {
    expect(getDurationFromRange('23:30', '01:00')).toBe(90);
    expect(getDurationFromRange('', '01:00')).toBeNull();
  });

  it('formats durations for the UI', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(1500)).toBe('1d 1h');
  });

  it('maps a task to editable form state', () => {
    const form = taskToFormState(makeTask({
      isDaily: true,
      durationMinutes: 90,
      date: '2026-07-22',
      time: '09:00',
      endTime: '10:30',
    }));
    expect(form).toMatchObject({
      recurrence: 'daily',
      durationHours: 1,
      durationMinutes: 30,
      date: '2026-07-22',
      time: '09:00',
      endTime: '10:30',
    });
  });

  it('trims task input and omits empty optional fields', () => {
    expect(formStateToTaskFields({
      ...DEFAULT_TASK_FORM,
      title: '  寫報告  ',
      durationMinutes: 0,
    })).toEqual({
      title: '寫報告',
      recurrence: undefined,
      isDaily: false,
      durationMinutes: 1,
      priority: 'medium',
      date: undefined,
      time: undefined,
      endTime: undefined,
      deadline: undefined,
      deadlineTime: undefined,
    });
  });
});
