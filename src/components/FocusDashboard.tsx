import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Clock3, Timer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PomodoroSession } from '../types';
import { formatDateISO } from '../utils';
import { Button } from './Button';

interface FocusDashboardProps {
  sessions: PomodoroSession[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

type FocusPeriod = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<FocusPeriod, string> = { day: '日', week: '週', month: '月' };

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getMonday = (date: Date) => {
  const result = startOfDay(date);
  const weekday = result.getDay() || 7;
  result.setDate(result.getDate() - weekday + 1);
  return result;
};

const formatMinutes = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} 分`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} 小時 ${remainder} 分` : `${hours} 小時`;
};

const formatTimeRange = (session: PomodoroSession) => {
  const formatter = new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${formatter.format(new Date(session.startTime))}–${formatter.format(new Date(session.endTime))}`;
};

export const FocusDashboard: React.FC<FocusDashboardProps> = ({ sessions, currentDate, onDateChange }) => {
  const [period, setPeriod] = useState<FocusPeriod>('week');

  const range = useMemo(() => {
    if (period === 'day') {
      const start = startOfDay(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    if (period === 'week') {
      const start = getMonday(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    return { start, end };
  }, [currentDate, period]);

  const periodSessions = useMemo(() => sessions
    .filter((session) => {
      const startedAt = new Date(session.startTime);
      return startedAt >= range.start && startedAt < range.end;
    })
    .sort((a, b) => b.startTime.localeCompare(a.startTime)), [range, sessions]);

  const chartData = useMemo(() => {
    if (period === 'day') {
      return Array.from({ length: 24 }, (_, hour) => ({
        label: String(hour).padStart(2, '0'),
        minutes: Math.round(periodSessions
          .filter((session) => new Date(session.startTime).getHours() === hour)
          .reduce((sum, session) => sum + session.focusSeconds, 0) / 60),
      }));
    }

    const numberOfDays = Math.round((range.end.getTime() - range.start.getTime()) / 86400000);
    return Array.from({ length: numberOfDays }, (_, index) => {
      const date = new Date(range.start);
      date.setDate(date.getDate() + index);
      const dateKey = formatDateISO(date);
      const minutes = Math.round(periodSessions
        .filter((session) => formatDateISO(new Date(session.startTime)) === dateKey)
        .reduce((sum, session) => sum + session.focusSeconds, 0) / 60);
      return {
        label: period === 'week'
          ? date.toLocaleDateString('zh-TW', { weekday: 'short' })
          : String(date.getDate()),
        minutes,
      };
    });
  }, [period, periodSessions, range]);

  const taskBreakdown = useMemo(() => {
    const totals = new Map<string, { title: string; color: string; seconds: number; count: number }>();
    periodSessions.forEach((session) => {
      const current = totals.get(session.taskId) ?? {
        title: session.taskTitle,
        color: session.taskColor,
        seconds: 0,
        count: 0,
      };
      current.seconds += session.focusSeconds;
      current.count += 1;
      totals.set(session.taskId, current);
    });
    return Array.from(totals.values()).sort((a, b) => b.seconds - a.seconds);
  }, [periodSessions]);

  const totalSeconds = periodSessions.reduce((sum, session) => sum + session.focusSeconds, 0);
  const activeDays = new Set(periodSessions.map((session) => formatDateISO(new Date(session.startTime)))).size;
  const averageSeconds = periodSessions.length > 0 ? totalSeconds / periodSessions.length : 0;

  const movePeriod = (direction: -1 | 1) => {
    const next = new Date(currentDate);
    if (period === 'day') next.setDate(next.getDate() + direction);
    if (period === 'week') next.setDate(next.getDate() + direction * 7);
    if (period === 'month') next.setMonth(next.getMonth() + direction);
    onDateChange(next);
  };

  const rangeLabel = period === 'day'
    ? currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    : period === 'week'
      ? `${range.start.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} – ${new Date(range.end.getTime() - 1).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}`
      : currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });

  return (
    <div className="h-full overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#101318] p-4 custom-scrollbar md:p-6">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-gray-100">
            <Timer size={14} /> 專注回顧
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/[0.08] bg-[#0b0d10] p-1">
            {(Object.keys(PERIOD_LABELS) as FocusPeriod[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${period === item ? 'bg-amber-300 text-gray-950' : 'text-gray-500 hover:text-gray-200'}`}
              >
                {PERIOD_LABELS[item]}
              </button>
            ))}
          </div>
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#0b0d10] p-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => movePeriod(-1)} aria-label="上一個期間"><ChevronLeft size={16} /></Button>
            <button type="button" onClick={() => onDateChange(new Date())} className="min-w-28 px-2 text-xs font-medium text-gray-300 hover:text-white">{rangeLabel}</button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => movePeriod(1)} aria-label="下一個期間"><ChevronRight size={16} /></Button>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={<Clock3 size={16} />} label="專注總時間" value={formatMinutes(totalSeconds)} accent="text-amber-200" />
        <SummaryCard icon={<Timer size={16} />} label="完成回合" value={`${periodSessions.length} 回`} accent="text-cyan-200" />
        <SummaryCard icon={<CalendarDays size={16} />} label={period === 'day' ? '平均每回' : '有投入的日子'} value={period === 'day' ? formatMinutes(averageSeconds) : `${activeDays} 天`} accent="text-emerald-200" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <section className="min-h-80 rounded-xl border border-white/[0.08] bg-[#12161b] p-4 md:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-100"><BarChart3 size={16} className="text-amber-300" />投入分布</h2>
              <p className="mt-1 text-xs text-gray-600">單位：分鐘</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={period === 'day' ? 2 : period === 'month' ? 2 : 0} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#0b0d10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} formatter={(value) => [`${value} 分鐘`, '專注']} />
                <Bar dataKey="minutes" fill="#fcd34d" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.08] bg-[#12161b] p-4 md:p-5">
          <h2 className="text-sm font-semibold text-gray-100">時間花在哪裡</h2>
          <div className="mt-4 space-y-3">
            {taskBreakdown.length === 0 && <p className="py-12 text-center text-sm text-gray-600">這個期間還沒有專注紀錄</p>}
            {taskBreakdown.map((task) => {
              const percentage = totalSeconds > 0 ? task.seconds / totalSeconds * 100 : 0;
              return (
                <div key={`${task.title}-${task.color}`}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium text-gray-300">{task.title}</span>
                    <span className="shrink-0 font-mono text-gray-500">{formatMinutes(task.seconds)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: task.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#12161b] p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">專注紀錄</h2>
          <span className="text-xs text-gray-600">{periodSessions.length} 筆</span>
        </div>
        <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 custom-scrollbar lg:grid-cols-2">
          {periodSessions.length === 0 && <p className="col-span-full py-8 text-center text-sm text-gray-600">從日檢視選一個任務，開始第一回番茄鐘。</p>}
          {periodSessions.map((session) => (
            <div key={session.id} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-[#0f1318] px-3 py-2.5">
              <span className="h-9 w-1 rounded-full" style={{ backgroundColor: session.taskColor }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-200">{session.taskTitle}</div>
                <div className="mt-0.5 text-[11px] text-gray-500">{new Date(session.startTime).toLocaleDateString('zh-TW')} · {formatTimeRange(session)}</div>
              </div>
              <span className="shrink-0 font-mono text-xs text-amber-200">{formatMinutes(session.focusSeconds)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string; accent: string }> = ({ icon, label, value, accent }) => (
  <div className="rounded-xl border border-white/[0.08] bg-[#12161b] p-4">
    <div className="flex items-center gap-2 text-xs text-gray-500">{icon}{label}</div>
    <div className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${accent}`}>{value}</div>
  </div>
);
