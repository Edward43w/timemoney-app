import React, { useEffect, useId } from 'react';
import { ArrowUpCircle, Calendar, ChevronDown, Flag, Repeat2, Trash2, X } from 'lucide-react';
import { PRIORITIES, Priority, Recurrence } from '../types';
import {
  TaskFormState,
  QUICK_DURATIONS,
  TIME_OPTIONS,
  durationToParts,
  formatDuration,
  getDurationFromRange,
  getDurationMinutes,
  getEndTimeFromDuration,
} from '../taskFormUtils';
import { Button } from './Button';
import { formatDateISO } from '../utils';

interface TaskFormModalProps {
  title: string;
  description?: string;
  value: TaskFormState;
  onChange: (value: TaskFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  onDelete?: () => void;
}

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none', label: '不重複' },
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每週' },
  { value: 'monthly', label: '每月' },
];

const TimeSelect = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={placeholder}
      className="w-full appearance-none rounded-md border border-white/[0.09] bg-[#0b0d10] px-2.5 py-2 pr-8 text-xs text-white outline-none transition-colors focus:border-accent/60"
    >
      <option value="">{placeholder}</option>
      {TIME_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
  </div>
);

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  title,
  description,
  value,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  onDelete,
}) => {
  const currentDuration = getDurationMinutes(value);
  const titleId = useId();
  const needsFixedSchedule = value.recurrence === 'weekly' || value.recurrence === 'monthly';
  const canSubmit = Boolean(value.title.trim()) && (!needsFixedSchedule || Boolean(value.date && value.time));
  const anchorDate = value.date ? new Date(`${value.date}T00:00:00`) : null;

  const updateRecurrence = (recurrence: Recurrence) => {
    onChange({
      ...value,
      recurrence,
      date: recurrence !== 'none' && !value.date ? formatDateISO(new Date()) : value.date,
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateDuration = (totalMinutes: number) => {
    onChange({
      ...value,
      ...durationToParts(totalMinutes),
      endTime: value.time ? getEndTimeFromDuration(value.time, totalMinutes) : value.endTime,
    });
  };

  const updateDurationPart = (part: 'durationDays' | 'durationHours' | 'durationMinutes', partValue: number) => {
    const nextValue = { ...value, [part]: Math.max(0, partValue) };
    const totalMinutes = getDurationMinutes(nextValue);
    onChange({
      ...value,
      ...durationToParts(totalMinutes),
      endTime: nextValue.time ? getEndTimeFromDuration(nextValue.time, totalMinutes) : nextValue.endTime,
    });
  };

  const updateStartTime = (time: string) => {
    const durationMinutes = getDurationMinutes(value);
    onChange({
      ...value,
      time,
      endTime: time ? getEndTimeFromDuration(time, durationMinutes) : '',
    });
  };

  const updateEndTime = (endTime: string) => {
    const totalMinutes = getDurationFromRange(value.time, endTime);
    onChange({
      ...value,
      ...(totalMinutes === null ? {} : durationToParts(totalMinutes)),
      endTime,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/[0.09] bg-[#12161b] p-4 shadow-2xl md:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 id={titleId} className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              aria-label="任務名稱"
              placeholder="任務名稱"
              className="min-w-0 flex-1 rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-accent/60"
              value={value.title}
              onChange={(event) => onChange({ ...value, title: event.target.value })}
              autoFocus
            />
            <Button type="submit" size="sm" className="h-9 w-9 p-0" aria-label={submitLabel} disabled={!canSubmit}>
              <ArrowUpCircle size={18} />
            </Button>
          </div>

          <div className="mb-3">
            <select
              aria-label="優先度"
              className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-2 py-2 text-xs font-semibold text-white outline-none focus:border-accent/60"
              value={value.priority}
              onChange={(event) => onChange({ ...value, priority: event.target.value as Priority })}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {{ high: '高優先', medium: '中優先', low: '低優先' }[priority]}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="mb-3 rounded-lg border border-white/[0.09] bg-[#0b0d10] p-3">
            <legend className="sr-only">重複規則</legend>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-300">
              <Repeat2 size={14} className="text-accent-strong" /> 重複規則
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {RECURRENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateRecurrence(option.value)}
                  className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                    value.recurrence === option.value
                      ? 'bg-accent text-accent-ink shadow-accent'
                      : 'bg-white/[0.035] text-gray-500 hover:bg-white/[0.07] hover:text-gray-200'
                  }`}
                  aria-pressed={value.recurrence === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {value.recurrence !== 'none' && (
              <p className="mt-2 text-[11px] leading-5 text-gray-500">
                {value.recurrence === 'daily' && '從首次日期起每天出現；未設定日期則立即開始。'}
                {value.recurrence === 'weekly' && (anchorDate ? `每週${anchorDate.toLocaleDateString('zh-TW', { weekday: 'long' })}固定出現。` : '選擇首次日期與開始時間。')}
                {value.recurrence === 'monthly' && (anchorDate ? `每月 ${anchorDate.getDate()} 日固定出現。` : '選擇首次日期與開始時間。')}
              </p>
            )}
          </fieldset>

          <div className="mb-3 rounded-lg border border-gray-700 bg-gray-900/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-300">所需時間</span>
              <span className="text-gray-500">{formatDuration(currentDuration)}</span>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {QUICK_DURATIONS.map((duration) => (
                <button
                  type="button"
                  key={duration.label}
                  onClick={() => updateDuration(duration.minutes)}
                  className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                    currentDuration === duration.minutes
                      ? 'bg-accent text-accent-ink shadow-accent'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className="space-y-1 text-gray-500">
                <span>天</span>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border border-white/[0.09] bg-[#0b0d10] px-2 py-1.5 text-white outline-none focus:border-accent/60"
                  value={value.durationDays}
                  onChange={(event) => updateDurationPart('durationDays', Number(event.target.value))}
                />
              </label>
              <label className="space-y-1 text-gray-500">
                <span>時</span>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border border-white/[0.09] bg-[#0b0d10] px-2 py-1.5 text-white outline-none focus:border-accent/60"
                  value={value.durationHours}
                  onChange={(event) => updateDurationPart('durationHours', Number(event.target.value))}
                />
              </label>
              <label className="space-y-1 text-gray-500">
                <span>分</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  className="w-full rounded-md border border-white/[0.09] bg-[#0b0d10] px-2 py-1.5 text-white outline-none focus:border-accent/60"
                  value={value.durationMinutes}
                  onChange={(event) => updateDurationPart('durationMinutes', Number(event.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-3">
            <div>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-300">
                <Calendar size={12} /> {value.recurrence === 'none' ? '排程' : '首次排程'}
              </h4>
              <div className="space-y-2">
                <input
                  type="date"
                  aria-label={value.recurrence === 'none' ? '排程日期' : '首次日期'}
                  className="w-full rounded-md border border-white/[0.09] bg-[#0b0d10] px-2.5 py-2 text-xs text-white outline-none focus:border-accent/60"
                  value={value.date}
                  onChange={(event) => onChange({ ...value, date: event.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <TimeSelect value={value.time} onChange={updateStartTime} placeholder="開始時間" />
                  <TimeSelect value={value.endTime} onChange={updateEndTime} placeholder="結束時間" />
                </div>
                {value.time && value.endTime && (
                  <p className="text-[11px] text-gray-500">
                    已依所需時間同步：{value.time} - {value.endTime}
                  </p>
                )}
                {needsFixedSchedule && (!value.date || !value.time) && (
                  <p className="text-[11px] font-medium text-red-300">每週與每月重複需要首次日期和開始時間。</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-red-400">
                <Flag size={12} /> 截止期限
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="rounded-md border border-gray-700 bg-gray-900 px-2.5 py-2 text-xs text-white outline-none focus:border-red-500"
                  value={value.deadline}
                  onChange={(event) => onChange({ ...value, deadline: event.target.value })}
                />
                <TimeSelect
                  value={value.deadlineTime}
                  onChange={(deadlineTime) => onChange({ ...value, deadlineTime })}
                  placeholder="截止時間"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {onDelete && (
              <Button type="button" variant="danger" className="flex-1" onClick={onDelete}>
                <Trash2 size={16} /> 刪除
              </Button>
            )}
            <Button type="submit" className="flex-auto" disabled={!canSubmit}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
