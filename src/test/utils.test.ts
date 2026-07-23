import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDateISO,
  getMinutesFromMidnight,
  getStartOfWeek,
  getTaskTimeRange,
  isSameDay,
  isTaskVisibleOnDate,
} from '../utils';

describe('date and formatting utilities', () => {
  it('formats a local date without shifting it to UTC', () => {
    expect(formatDateISO(new Date(2026, 6, 22, 23, 30))).toBe('2026-07-22');
  });

  it('returns Monday as the beginning of the week', () => {
    const monday = getStartOfWeek(new Date(2026, 6, 22));
    expect(formatDateISO(monday)).toBe('2026-07-20');
  });

  it('compares dates by calendar day', () => {
    expect(isSameDay(new Date(2026, 6, 22, 1), new Date(2026, 6, 22, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 6, 22), new Date(2026, 6, 23))).toBe(false);
  });

  it('builds a task range that can cross midnight', () => {
    const range = getTaskTimeRange('2026-07-22', '23:30', 90);
    expect(range?.start.getHours()).toBe(23);
    expect(formatDateISO(range!.end)).toBe('2026-07-23');
    expect(range?.end.getHours()).toBe(1);
  });

  it('shows a cross-midnight task on both affected dates', () => {
    const task = { date: '2026-07-22', time: '23:30', durationMinutes: 90 };
    expect(isTaskVisibleOnDate(task, new Date(2026, 6, 22))).toBe(true);
    expect(isTaskVisibleOnDate(task, new Date(2026, 6, 23))).toBe(true);
    expect(isTaskVisibleOnDate(task, new Date(2026, 6, 24))).toBe(false);
  });

  it('converts time to minutes after midnight', () => {
    expect(getMinutesFromMidnight(new Date(2026, 6, 22, 9, 45))).toBe(585);
  });

  it('formats currency consistently', () => {
    expect(formatCurrency(14072)).toBe('$14,072');
    expect(formatCurrency(-2000)).toBe('-$2,000');
  });
});
