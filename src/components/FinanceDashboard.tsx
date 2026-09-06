import React, { useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Allocation, DEFAULT_ALLOCATION_CATEGORIES, Expense, Income } from '../types';
import { cn, formatCurrency, formatDateISO, generateId } from '../utils';
import { Button } from './Button';
import { CalendarDays, ChevronRight, DollarSign, Pencil, Plus, SlidersHorizontal, Trash2, TrendingUp, Wallet, X } from 'lucide-react';
import { IconButton } from './ui/IconButton';
import { Surface } from './ui/Surface';

interface FinanceDashboardProps {
  expenses: Expense[];
  incomes: Income[];
  allocations: Allocation[];
  onDeleteExpense: (expenseId: string) => void;
  onDeleteIncome: (incomeId: string) => void;
  onAddAllocation: (allocation: Allocation) => void;
  onUpdateAllocation: (allocation: Allocation) => void;
  onDeleteAllocation: (allocationId: string) => void;
  expenseCategories: string[];
  currentDate: Date;
}

type Transaction = (Income & { type: 'income' }) | (Expense & { type: 'expense' });

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
];

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

interface ExpenseTooltipPayload {
  name?: string | number;
  value?: string | number;
  payload?: { name?: string | number };
}

export const ExpenseChartTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ExpenseTooltipPayload[];
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item.name ?? item.payload?.name ?? '';

  return (
    <div className="rounded-control border border-line bg-canvas-raised px-3 py-2 shadow-panel">
      <div className="text-xs font-medium text-ink-soft">{String(name)}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-accent-strong">
        {formatCurrency(Number(item.value ?? 0))}
      </div>
    </div>
  );
};

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  expenses,
  incomes,
  allocations,
  onDeleteExpense,
  onDeleteIncome,
  onAddAllocation,
  onUpdateAllocation,
  onDeleteAllocation,
  expenseCategories,
  currentDate,
}) => {
  const monthKey = getMonthKey(currentDate);
  const monthLabel = currentDate.toLocaleDateString('zh-TW', { month: 'long', year: 'numeric' });
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [allocationForm, setAllocationForm] = useState({ id: '', category: '', plannedAmount: 0 });
  const [recordFilters, setRecordFilters] = useState({ category: 'all', startDate: `${monthKey}-01`, endDate: formatDateISO(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)) });

  useEffect(() => {
    if (!showAllocationModal && !showTransactionsModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowAllocationModal(false);
      setShowTransactionsModal(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAllocationModal, showTransactionsModal]);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.date.startsWith(monthKey));
  }, [expenses, monthKey]);

  const monthlyIncomes = useMemo(() => {
    return incomes.filter((income) => income.date.startsWith(monthKey));
  }, [incomes, monthKey]);

  const monthlyAllocations = useMemo(() => {
    return allocations.filter((allocation) => allocation.month === monthKey);
  }, [allocations, monthKey]);

  const allocationOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_ALLOCATION_CATEGORIES, ...expenseCategories])),
    [expenseCategories],
  );
  const budgetCategoryOptions = useMemo(
    () => monthlyAllocations.length > 0
      ? Array.from(new Set(monthlyAllocations.map((allocation) => allocation.category)))
      : expenseCategories.length > 0 ? expenseCategories : DEFAULT_ALLOCATION_CATEGORIES,
    [expenseCategories, monthlyAllocations],
  );

  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = monthlyIncomes.reduce((sum, income) => sum + income.amount, 0);
  const netCashFlow = totalIncome - totalSpent;
  const totalAllocated = monthlyAllocations.reduce((sum, allocation) => sum + allocation.plannedAmount, 0);
  const unallocated = totalIncome - totalAllocated;

  const categorySpend = useMemo(() => {
    const totals: Record<string, number> = {};
    monthlyExpenses.forEach((expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });
    return totals;
  }, [monthlyExpenses]);

  const categoryData = useMemo(() => {
    return Object.entries(categorySpend).map(([name, value]) => ({ name, value }));
  }, [categorySpend]);

  const allocationRows = useMemo(() => {
    return monthlyAllocations.map((allocation) => {
      const spent = categorySpend[allocation.category] || 0;
      const remaining = allocation.plannedAmount - spent;
      const usedPercent = allocation.plannedAmount > 0 ? Math.min((spent / allocation.plannedAmount) * 100, 100) : 0;
      return { ...allocation, spent, remaining, usedPercent };
    });
  }, [categorySpend, monthlyAllocations]);

  const allTransactions = useMemo<Transaction[]>(() => {
    const incomeRows = incomes.map((income) => ({ ...income, type: 'income' as const }));
    const expenseRows = expenses.map((expense) => ({ ...expense, type: 'expense' as const }));
    return [...incomeRows, ...expenseRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, incomes]);

  const recentTransactions = allTransactions.slice(0, 5);
  const recordCategories = budgetCategoryOptions;
  const filteredTransactions = allTransactions.filter((item) => {
    const matchesCategory = recordFilters.category === 'all' || item.category === recordFilters.category;
    const matchesStart = !recordFilters.startDate || item.date >= recordFilters.startDate;
    const matchesEnd = !recordFilters.endDate || item.date <= recordFilters.endDate;
    return matchesCategory && matchesStart && matchesEnd;
  });

  const openTransactionsModal = () => {
    setRecordFilters({
      category: 'all',
      startDate: `${monthKey}-01`,
      endDate: formatDateISO(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)),
    });
    setShowTransactionsModal(true);
  };

  const openNewAllocation = () => {
    const nextCategory = DEFAULT_ALLOCATION_CATEGORIES.find((category) => !monthlyAllocations.some((item) => item.category === category))
      || expenseCategories.find((category) => !monthlyAllocations.some((item) => item.category === category))
      || '';
    setAllocationForm({ id: '', category: nextCategory, plannedAmount: 0 });
    setShowAllocationModal(true);
  };

  const openEditAllocation = (allocation: Allocation) => {
    setAllocationForm({ id: allocation.id, category: allocation.category, plannedAmount: allocation.plannedAmount });
    setShowAllocationModal(true);
  };

  const saveAllocation = () => {
    const category = allocationForm.category.trim();
    if (!category || allocationForm.plannedAmount <= 0) return;

    const allocation: Allocation = {
      id: allocationForm.id || generateId(),
      category,
      plannedAmount: allocationForm.plannedAmount,
      month: monthKey,
    };

    if (allocationForm.id) {
      onUpdateAllocation(allocation);
    } else {
      onAddAllocation(allocation);
    }
    setShowAllocationModal(false);
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-4 overflow-y-auto pb-24 pr-1 md:gap-5 md:pb-2">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-1 pb-1 pt-2 md:px-2">
        <div>
          <div className="tm-kicker flex items-center gap-2">
            <CalendarDays size={14} strokeWidth={1.8} />
            本月財務
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-ink">{monthLabel}</h1>
        </div>
      </header>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))]">
        <StatCard label="淨現金流" value={formatCurrency(netCashFlow)} tone={netCashFlow >= 0 ? 'info' : 'accent'} sub={netCashFlow >= 0 ? '本月收入扣除支出後的結餘' : '本月支出高於收入'} emphasis />
        <StatCard label="收入" value={formatCurrency(totalIncome)} tone="positive" sub={`${monthlyIncomes.length} 筆`} />
        <StatCard label="支出" value={formatCurrency(totalSpent)} tone="negative" sub={`${monthlyExpenses.length} 筆`} />
        <StatCard label="未分配" value={formatCurrency(unallocated)} tone={unallocated >= 0 ? 'focus' : 'accent'} sub={`已規劃 ${formatCurrency(totalAllocated)}`} />
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:h-[320px] xl:grid-cols-[1.15fr_0.85fr]">
        <Surface as="section" className="flex min-h-0 flex-col p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.015em] text-ink">預算分配</h2>
              <p className="mt-0.5 text-xs leading-5 text-muted">規劃各分類額度，記帳時直接選擇歸屬。</p>
            </div>
            <Button size="sm" onClick={openNewAllocation}>
              <Plus size={14} /> 新增分類
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {allocationRows.length === 0 && (
              <div className="rounded-control border-l-2 border-accent/50 bg-canvas-raised px-4 py-5 text-sm leading-6 text-muted">
                還沒有預算分配。先新增生活、儲蓄或固定支出，讓本月收入有清楚去向。
              </div>
            )}
            {allocationRows.map((allocation) => (
              <div key={allocation.id} className="group rounded-control bg-canvas-raised p-3 ring-1 ring-transparent transition-[background-color,box-shadow] duration-200 hover:bg-surface-muted hover:ring-line">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{allocation.category}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      已使用 {formatCurrency(allocation.spent)}／分配 {formatCurrency(allocation.plannedAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton size="sm" onClick={() => openEditAllocation(allocation)} aria-label={`編輯 ${allocation.category}`}>
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton size="sm" tone="danger" onClick={() => onDeleteAllocation(allocation.id)} aria-label={`刪除 ${allocation.category}`}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${allocation.remaining >= 0 ? 'bg-positive' : 'bg-negative'}`}
                    style={{ width: `${allocation.usedPercent}%` }}
                  />
                </div>
                <div className={`mt-2 text-xs font-medium ${allocation.remaining >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {allocation.remaining >= 0 ? `剩餘 ${formatCurrency(allocation.remaining)}` : `超出 ${formatCurrency(Math.abs(allocation.remaining))}`}
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface as="section" className="flex min-h-0 flex-col p-4 md:p-5">
          <div className="mb-2">
            <h2 className="text-base font-semibold tracking-[-0.015em] text-ink">支出分布</h2>
            <p className="mt-0.5 text-xs text-muted">本月花費流向</p>
          </div>
          <div className="h-[260px] min-h-0 xl:h-auto xl:flex-1">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ExpenseChartTooltip />} cursor={{ fill: 'transparent' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">本月還沒有支出紀錄。</div>
            )}
          </div>
        </Surface>
      </div>

      <Surface as="section" className="flex min-h-[220px] flex-1 flex-col p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.015em] text-ink">最近紀錄</h2>
            <p className="mt-0.5 text-xs text-muted">最近 5 筆收支變動</p>
          </div>
          <Button size="sm" variant="quiet" onClick={openTransactionsModal}>
            查看本月與篩選 <ChevronRight size={14} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {recentTransactions.length === 0 && <div className="rounded-control border-l-2 border-accent/50 bg-canvas-raised px-4 py-5 text-sm text-muted">還沒有收支紀錄。新增第一筆收入或支出後，最近變動會顯示在這裡。</div>}
          {recentTransactions.map((item) => (
            <TransactionRow key={`${item.type}-${item.id}`} item={item} onDeleteIncome={onDeleteIncome} onDeleteExpense={onDeleteExpense} />
          ))}
        </div>
      </Surface>

      {showTransactionsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="transactions-title" className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-frame bg-surface shadow-float ring-1 ring-line md:h-[min(760px,88dvh)] md:rounded-frame">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-6">
              <div>
                <div className="tm-kicker mb-1 flex items-center gap-2">
                  <SlidersHorizontal size={14} /> 收支查詢
                </div>
                <h2 id="transactions-title" className="text-xl font-semibold tracking-[-0.025em] text-ink">收支紀錄</h2>
              </div>
              <IconButton onClick={() => setShowTransactionsModal(false)} aria-label="關閉收支紀錄">
                <X size={18} />
              </IconButton>
            </div>

            <div className="grid shrink-0 gap-3 border-b border-line bg-canvas-raised px-5 py-4 sm:grid-cols-3 md:px-6">
              <label className="space-y-1.5 text-xs text-muted">
                <span>分類</span>
                <select value={recordFilters.category} onChange={(event) => setRecordFilters({ ...recordFilters, category: event.target.value })} className="tm-field text-sm">
                  <option value="all">全部分類</option>
                  {recordCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs text-muted">
                <span>開始日期</span>
                <input type="date" value={recordFilters.startDate} onChange={(event) => setRecordFilters({ ...recordFilters, startDate: event.target.value })} className="tm-field text-sm" />
              </label>
              <label className="space-y-1.5 text-xs text-muted">
                <span>結束日期</span>
                <input type="date" value={recordFilters.endDate} onChange={(event) => setRecordFilters({ ...recordFilters, endDate: event.target.value })} className="tm-field text-sm" />
              </label>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-4 md:px-6">
              <div className="mb-3 text-xs text-muted">符合條件：{filteredTransactions.length} 筆</div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredTransactions.length === 0 && <div className="rounded-control bg-canvas-raised p-8 text-center text-sm text-muted">這個日期區間沒有符合條件的紀錄。</div>}
                {filteredTransactions.map((item) => (
                  <TransactionRow key={`${item.type}-${item.id}`} item={item} onDeleteIncome={onDeleteIncome} onDeleteExpense={onDeleteExpense} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="allocation-form-title" className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-frame bg-surface p-5 shadow-float ring-1 ring-line md:rounded-frame md:p-6">
            <h2 id="allocation-form-title" className="mb-5 text-xl font-semibold tracking-[-0.025em] text-ink">{allocationForm.id ? '編輯預算分配' : '新增預算分配'}</h2>
            <div className="space-y-4">
              <input
                list="allocation-categories"
                aria-label="預算分類"
                className="tm-field"
                placeholder="分類名稱"
                value={allocationForm.category}
                onChange={(event) => setAllocationForm({ ...allocationForm, category: event.target.value })}
              />
              <datalist id="allocation-categories">
                {allocationOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <input
                type="number"
                aria-label="規劃金額"
                min="0"
                step="0.01"
                className="tm-field"
                placeholder="分配金額"
                value={allocationForm.plannedAmount || ''}
                onChange={(event) => setAllocationForm({ ...allocationForm, plannedAmount: parseFloat(event.target.value) || 0 })}
              />
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="ghost" onClick={() => setShowAllocationModal(false)}>取消</Button>
                <Button className="flex-1" onClick={saveAllocation} disabled={!allocationForm.category || allocationForm.plannedAmount <= 0}>
                  儲存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const TransactionRow = ({
  item,
  onDeleteIncome,
  onDeleteExpense,
}: {
  item: Transaction;
  onDeleteIncome: (incomeId: string) => void;
  onDeleteExpense: (expenseId: string) => void;
}) => (
  <div className={cn(
    'group flex items-center justify-between gap-3 rounded-control border-l-2 bg-canvas-raised px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-surface-muted',
    item.type === 'income' ? 'border-positive/55' : 'border-negative/55',
  )}>
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold tracking-[0.08em] ${item.type === 'income' ? 'text-positive' : 'text-negative'}`}>
          {item.type === 'income' ? '收入' : '支出'}
        </span>
        <span className="truncate font-medium text-ink-soft">{item.title}</span>
      </div>
      <div className="mt-1 text-xs text-muted">{item.date} · {item.category}</div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className={`tm-number font-semibold ${item.type === 'income' ? 'text-positive' : 'text-negative'}`}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </span>
      <IconButton
        size="sm"
        tone="danger"
        onClick={() => item.type === 'income' ? onDeleteIncome(item.id) : onDeleteExpense(item.id)}
        aria-label={`刪除 ${item.title}`}
      >
        <Trash2 size={14} />
      </IconButton>
    </div>
  </div>
);

type StatTone = 'positive' | 'negative' | 'info' | 'accent' | 'focus';

const StatCard = ({
  label,
  value,
  sub,
  tone,
  emphasis = false,
  className,
}: {
  label: string;
  value: string;
  sub: string;
  tone: StatTone;
  emphasis?: boolean;
  className?: string;
}) => {
  const toneClasses = {
    positive: 'bg-positive-muted text-positive',
    negative: 'bg-negative-muted text-negative',
    info: 'bg-info-muted text-info',
    accent: 'bg-accent-muted text-accent',
    focus: 'bg-focus-muted text-focus',
  };

  return (
    <div className={cn('relative min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#12161b] p-4 md:p-5', emphasis && 'bg-[#151a1f]', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.06em] text-muted">{label}</span>
        <span className={cn('grid h-8 w-8 place-items-center rounded-control', toneClasses[tone])}>
          {label === '收入' ? <Wallet size={15} strokeWidth={1.8} /> : label === '支出' ? <DollarSign size={15} strokeWidth={1.8} /> : <TrendingUp size={15} strokeWidth={1.8} />}
        </span>
      </div>
      <div className={cn('tm-number mt-2 truncate font-semibold text-ink', emphasis ? 'text-3xl' : 'text-2xl')}>{value}</div>
      <div className="mt-1 truncate text-xs text-muted">{sub}</div>
    </div>
  );
};
