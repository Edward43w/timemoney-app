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
import { formatCurrency, formatDateISO, generateId } from '../utils';
import { Button } from './Button';
import { CalendarDays, ChevronRight, DollarSign, Pencil, Plus, SlidersHorizontal, Trash2, TrendingUp, Wallet, X } from 'lucide-react';

interface FinanceDashboardProps {
  expenses: Expense[];
  incomes: Income[];
  allocations: Allocation[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onAddIncome: (income: Income) => void;
  onDeleteIncome: (incomeId: string) => void;
  onAddAllocation: (allocation: Allocation) => void;
  onUpdateAllocation: (allocation: Allocation) => void;
  onDeleteAllocation: (allocationId: string) => void;
  expenseCategories: string[];
  currentDate: Date;
}

type MoneyFormMode = 'income' | 'expense';
type Transaction = (Income & { type: 'income' }) | (Expense & { type: 'expense' });

const COLORS = ['#d6a756', '#789987', '#aa726a', '#75869a', '#8b819e', '#9b876e', '#6f9292', '#777d86'];

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  expenses,
  incomes,
  allocations,
  onAddExpense,
  onDeleteExpense,
  onAddIncome,
  onDeleteIncome,
  onAddAllocation,
  onUpdateAllocation,
  onDeleteAllocation,
  expenseCategories,
  currentDate,
}) => {
  const monthKey = getMonthKey(currentDate);
  const monthLabel = currentDate.toLocaleDateString('zh-TW', { month: 'long', year: 'numeric' });
  const [moneyMode, setMoneyMode] = useState<MoneyFormMode>('expense');
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [moneyForm, setMoneyForm] = useState({ title: '', amount: 0, category: '', date: formatDateISO(new Date()) });
  const [allocationForm, setAllocationForm] = useState({ id: '', category: '', plannedAmount: 0 });
  const [recordFilters, setRecordFilters] = useState({ category: 'all', startDate: `${monthKey}-01`, endDate: formatDateISO(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)) });

  useEffect(() => {
    if (!showMoneyModal && !showAllocationModal && !showTransactionsModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowMoneyModal(false);
      setShowAllocationModal(false);
      setShowTransactionsModal(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAllocationModal, showMoneyModal, showTransactionsModal]);

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

  const openMoneyModal = (mode: MoneyFormMode) => {
    setMoneyMode(mode);
    setMoneyForm({
      title: '',
      amount: 0,
      category: budgetCategoryOptions[0] || 'Other',
      date: formatDateISO(currentDate),
    });
    setShowMoneyModal(true);
  };

  const saveMoney = () => {
    if (!moneyForm.title.trim() || moneyForm.amount <= 0 || !moneyForm.date) return;

    if (moneyMode === 'income') {
      onAddIncome({
        id: generateId(),
        title: moneyForm.title.trim(),
        amount: moneyForm.amount,
        category: budgetCategoryOptions.includes(moneyForm.category) ? moneyForm.category : budgetCategoryOptions[0] || 'Other',
        date: moneyForm.date,
      });
    } else {
      onAddExpense({
        id: generateId(),
        title: moneyForm.title.trim(),
        amount: moneyForm.amount,
        category: budgetCategoryOptions.includes(moneyForm.category) ? moneyForm.category : budgetCategoryOptions[0] || 'Other',
        date: moneyForm.date,
      });
    }

    setShowMoneyModal(false);
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
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-24 pr-1 md:gap-5 md:pb-2">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] px-1 pb-4 pt-2 md:px-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-gray-500">
            <CalendarDays size={14} />
            本月財務
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">{monthLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => openMoneyModal('income')}>
            <Plus size={14} /> 收入
          </Button>
          <Button size="sm" onClick={() => openMoneyModal('expense')}>
            <Plus size={14} /> 支出
          </Button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="收入" value={formatCurrency(totalIncome)} tone="emerald" sub={`${monthlyIncomes.length} 筆`} />
        <StatCard label="支出" value={formatCurrency(totalSpent)} tone="red" sub={`${monthlyExpenses.length} 筆`} />
        <StatCard label="淨現金流" value={formatCurrency(netCashFlow)} tone={netCashFlow >= 0 ? 'blue' : 'amber'} sub={netCashFlow >= 0 ? '本月結餘' : '本月缺口'} />
        <StatCard label="未分配" value={formatCurrency(unallocated)} tone={unallocated >= 0 ? 'violet' : 'amber'} sub={`已規劃 ${formatCurrency(totalAllocated)}`} />
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:h-[320px] xl:grid-cols-[1.15fr_0.85fr]">
        <section className="flex min-h-0 flex-col rounded-xl border border-white/[0.08] bg-[#12161b] p-4 md:rounded-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">預算分配</h2>
              <p className="text-xs leading-5 text-gray-500">規劃本月各分類額度，記帳時可直接選擇歸屬。</p>
            </div>
            <Button size="sm" onClick={openNewAllocation}>
              <Plus size={14} /> 新增分類
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {allocationRows.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-700 p-5 text-sm text-gray-500">
                還沒有預算分配。可以先從生活、儲蓄或固定支出開始。
              </div>
            )}
            {allocationRows.map((allocation) => (
              <div key={allocation.id} className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{allocation.category}</div>
                    <div className="text-xs text-gray-500">
                      已使用 {formatCurrency(allocation.spent)}／分配 {formatCurrency(allocation.plannedAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="px-2" onClick={() => openEditAllocation(allocation)} aria-label={`編輯 ${allocation.category}`}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2 text-red-300 hover:text-red-200" onClick={() => onDeleteAllocation(allocation.id)} aria-label={`刪除 ${allocation.category}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className={`h-full rounded-full ${allocation.remaining >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${allocation.usedPercent}%` }}
                  />
                </div>
                <div className={`mt-2 text-xs font-medium ${allocation.remaining >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {allocation.remaining >= 0 ? `剩餘 ${formatCurrency(allocation.remaining)}` : `超出 ${formatCurrency(Math.abs(allocation.remaining))}`}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-white/[0.08] bg-[#12161b] p-4 md:rounded-2xl">
          <h2 className="mb-4 text-lg font-semibold text-white">支出分布</h2>
          <div className="h-[260px] min-h-0 xl:h-auto xl:flex-1">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">本月還沒有支出紀錄。</div>
            )}
          </div>
        </section>
      </div>

      <section className="flex min-h-[220px] flex-1 flex-col rounded-xl border border-white/[0.08] bg-[#12161b] p-4 md:rounded-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">最近紀錄</h2>
            <p className="mt-0.5 text-xs text-gray-500">最近 5 筆收支變動</p>
          </div>
          <button type="button" onClick={openTransactionsModal} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-300/10">
            查看本月與篩選 <ChevronRight size={14} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {recentTransactions.length === 0 && <div className="rounded-lg border border-dashed border-white/[0.1] p-5 text-sm text-gray-500">還沒有收支紀錄。</div>}
          {recentTransactions.map((item) => (
            <TransactionRow key={`${item.type}-${item.id}`} item={item} onDeleteIncome={onDeleteIncome} onDeleteExpense={onDeleteExpense} />
          ))}
        </div>
      </section>

      {showTransactionsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="transactions-title" className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-white/[0.09] bg-[#12161b] shadow-2xl md:h-[min(760px,88dvh)] md:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4 md:px-6">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-gray-500">
                  <SlidersHorizontal size={14} /> 收支查詢
                </div>
                <h2 id="transactions-title" className="text-xl font-semibold text-white">收支紀錄</h2>
              </div>
              <button type="button" onClick={() => setShowTransactionsModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/[0.06] hover:text-white" aria-label="關閉收支紀錄">
                <X size={18} />
              </button>
            </div>

            <div className="grid shrink-0 gap-3 border-b border-white/[0.08] bg-[#0f1217] px-5 py-4 sm:grid-cols-3 md:px-6">
              <label className="space-y-1.5 text-xs text-gray-500">
                <span>分類</span>
                <select value={recordFilters.category} onChange={(event) => setRecordFilters({ ...recordFilters, category: event.target.value })} className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-sm text-gray-200 outline-none focus:border-amber-300/60">
                  <option value="all">全部分類</option>
                  {recordCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs text-gray-500">
                <span>開始日期</span>
                <input type="date" value={recordFilters.startDate} onChange={(event) => setRecordFilters({ ...recordFilters, startDate: event.target.value })} className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-sm text-gray-200 outline-none focus:border-amber-300/60" />
              </label>
              <label className="space-y-1.5 text-xs text-gray-500">
                <span>結束日期</span>
                <input type="date" value={recordFilters.endDate} onChange={(event) => setRecordFilters({ ...recordFilters, endDate: event.target.value })} className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-sm text-gray-200 outline-none focus:border-amber-300/60" />
              </label>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-4 md:px-6">
              <div className="mb-3 text-xs text-gray-500">符合條件：{filteredTransactions.length} 筆</div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredTransactions.length === 0 && <div className="rounded-lg border border-dashed border-white/[0.1] p-8 text-center text-sm text-gray-500">這個日期區間沒有符合條件的紀錄。</div>}
                {filteredTransactions.map((item) => (
                  <TransactionRow key={`${item.type}-${item.id}`} item={item} onDeleteIncome={onDeleteIncome} onDeleteExpense={onDeleteExpense} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="money-form-title" className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/[0.09] bg-[#12161b] p-5 shadow-2xl md:rounded-2xl md:p-6">
            <h2 id="money-form-title" className="mb-4 text-xl font-semibold text-white">{moneyMode === 'income' ? '新增收入' : '新增支出'}</h2>
            <div className="space-y-4">
              <input
                type="text"
                aria-label={moneyMode === 'income' ? '收入名稱' : '支出名稱'}
                className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-white outline-none focus:border-amber-300/60"
                placeholder={moneyMode === 'income' ? 'e.g. Salary' : 'e.g. Lunch'}
                value={moneyForm.title}
                onChange={(event) => setMoneyForm({ ...moneyForm, title: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  aria-label="金額"
                  min="0"
                  step="0.01"
                  className="rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-white outline-none focus:border-amber-300/60"
                  placeholder="Amount"
                  value={moneyForm.amount || ''}
                  onChange={(event) => setMoneyForm({ ...moneyForm, amount: parseFloat(event.target.value) || 0 })}
                />
                <input
                  type="date"
                  aria-label="日期"
                  className="rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-white outline-none focus:border-amber-300/60"
                  value={moneyForm.date}
                  onChange={(event) => setMoneyForm({ ...moneyForm, date: event.target.value })}
                />
              </div>
              <select
                aria-label="分類"
                className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-white outline-none focus:border-amber-300/60"
                value={moneyForm.category}
                onChange={(event) => setMoneyForm({ ...moneyForm, category: event.target.value })}
              >
                {budgetCategoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="ghost" onClick={() => setShowMoneyModal(false)}>取消</Button>
                <Button className="flex-1" onClick={saveMoney} disabled={!moneyForm.title || moneyForm.amount <= 0}>
                  儲存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="allocation-form-title" className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/[0.09] bg-[#12161b] p-5 shadow-2xl md:rounded-2xl md:p-6">
            <h2 id="allocation-form-title" className="mb-4 text-xl font-semibold text-white">{allocationForm.id ? '編輯預算分配' : '新增預算分配'}</h2>
            <div className="space-y-4">
              <input
                list="allocation-categories"
                aria-label="預算分類"
                className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-white outline-none focus:border-amber-300/60"
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
                className="w-full rounded-lg border border-white/[0.09] bg-[#0b0d10] px-3 py-2 text-white outline-none focus:border-amber-300/60"
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
  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-[#0d1116] px-3 py-2.5 text-sm">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
          {item.type === 'income' ? '收入' : '支出'}
        </span>
        <span className="truncate text-gray-200">{item.title}</span>
      </div>
      <div className="mt-1 text-xs text-gray-500">{item.date} · {item.category}</div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className={`font-mono font-semibold ${item.type === 'income' ? 'text-emerald-300' : 'text-red-300'}`}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="px-2 text-gray-500 hover:text-red-300"
        onClick={() => item.type === 'income' ? onDeleteIncome(item.id) : onDeleteExpense(item.id)}
        aria-label={`刪除 ${item.title}`}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  </div>
);

const StatCard = ({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'emerald' | 'red' | 'blue' | 'amber' | 'violet' }) => {
  const toneClasses = {
    emerald: 'bg-emerald-400',
    red: 'bg-red-400',
    blue: 'bg-sky-400',
    amber: 'bg-amber-300',
    violet: 'bg-violet-300',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#12161b] p-4">
      <div className={`absolute inset-x-0 top-0 h-px opacity-80 ${toneClasses[tone]}`} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.08em] text-gray-400">{label}</span>
        <span className="text-gray-500">{label === '收入' ? <Wallet size={16} /> : label === '支出' ? <DollarSign size={16} /> : <TrendingUp size={16} />}</span>
      </div>
      <div className="mt-2 truncate font-mono text-2xl font-semibold tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{sub}</div>
    </div>
  );
};
