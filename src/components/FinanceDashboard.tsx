import React, { useMemo, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Allocation, DEFAULT_ALLOCATION_CATEGORIES, DEFAULT_INCOME_CATEGORIES, Expense, Income } from '../types';
import { formatCurrency, formatDateISO, generateId } from '../utils';
import { Button } from './Button';
import { CalendarDays, DollarSign, Pencil, Plus, Trash2, TrendingUp, Wallet } from 'lucide-react';

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

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
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [moneyMode, setMoneyMode] = useState<MoneyFormMode>('expense');
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [moneyForm, setMoneyForm] = useState({ title: '', amount: 0, category: '', date: formatDateISO(new Date()) });
  const [allocationForm, setAllocationForm] = useState({ id: '', category: '', plannedAmount: 0 });

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.date.startsWith(monthKey));
  }, [expenses, monthKey]);

  const monthlyIncomes = useMemo(() => {
    return incomes.filter((income) => income.date.startsWith(monthKey));
  }, [incomes, monthKey]);

  const monthlyAllocations = useMemo(() => {
    return allocations.filter((allocation) => allocation.month === monthKey);
  }, [allocations, monthKey]);

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

  const transactions = useMemo(() => {
    const incomeRows = monthlyIncomes.map((income) => ({ ...income, type: 'income' as const }));
    const expenseRows = monthlyExpenses.map((expense) => ({ ...expense, type: 'expense' as const }));
    return [...incomeRows, ...expenseRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [monthlyExpenses, monthlyIncomes]);

  const expenseEnvelopeOptions = monthlyAllocations.length > 0
    ? monthlyAllocations.map((allocation) => allocation.category)
    : expenseCategories;

  const openMoneyModal = (mode: MoneyFormMode) => {
    setMoneyMode(mode);
    setMoneyForm({
      title: '',
      amount: 0,
      category: mode === 'income' ? DEFAULT_INCOME_CATEGORIES[0] : expenseEnvelopeOptions[0] || 'Other',
      date: formatDateISO(new Date()),
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
        category: moneyForm.category || 'Income',
        date: moneyForm.date,
      });
    } else {
      onAddExpense({
        id: generateId(),
        title: moneyForm.title.trim(),
        amount: moneyForm.amount,
        category: expenseEnvelopeOptions.includes(moneyForm.category) ? moneyForm.category : expenseEnvelopeOptions[0] || 'Other',
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

  const allocationOptions = Array.from(new Set([...DEFAULT_ALLOCATION_CATEGORIES, ...expenseCategories]));

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-24 pr-1 md:gap-6 md:pb-2">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-600 bg-gray-800 px-4 py-3 md:rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <CalendarDays size={14} />
            Wallet Month
          </div>
          <h2 className="mt-1 text-2xl font-bold text-white">{monthLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => openMoneyModal('income')} className="bg-emerald-600 hover:bg-emerald-500">
            <Plus size={14} /> Income
          </Button>
          <Button size="sm" onClick={() => openMoneyModal('expense')}>
            <Plus size={14} /> Expense
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Income" value={formatCurrency(totalIncome)} tone="emerald" sub={`${monthlyIncomes.length} records`} />
        <StatCard label="Expense" value={formatCurrency(totalSpent)} tone="red" sub={`${monthlyExpenses.length} records`} />
        <StatCard label="Net Flow" value={formatCurrency(netCashFlow)} tone={netCashFlow >= 0 ? 'blue' : 'amber'} sub={netCashFlow >= 0 ? 'cash left' : 'cash gap'} />
        <StatCard label="Unallocated" value={formatCurrency(unallocated)} tone={unallocated >= 0 ? 'violet' : 'amber'} sub={`${formatCurrency(totalAllocated)} planned`} />
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-gray-600 bg-gray-800 p-4 md:rounded-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Envelope Plan</h2>
              <p className="text-xs text-gray-500">Custom monthly allocations. Expenses can choose which envelope they spend from.</p>
            </div>
            <Button size="sm" onClick={openNewAllocation}>
              <Plus size={14} /> Envelope
            </Button>
          </div>

          <div className="space-y-3">
            {allocationRows.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-700 p-5 text-sm text-gray-500">
                No envelopes yet. Add categories like Living, Savings, or Fixed Costs.
              </div>
            )}
            {allocationRows.map((allocation) => (
              <div key={allocation.id} className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{allocation.category}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(allocation.spent)} spent / {formatCurrency(allocation.plannedAmount)} planned
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="px-2" onClick={() => openEditAllocation(allocation)}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2 text-red-300 hover:text-red-200" onClick={() => onDeleteAllocation(allocation.id)}>
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
                  {allocation.remaining >= 0 ? `${formatCurrency(allocation.remaining)} remaining` : `${formatCurrency(Math.abs(allocation.remaining))} over`}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-600 bg-gray-800 p-4 md:rounded-2xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Spending Mix</h2>
          <div className="h-[260px]">
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
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No expenses this month.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4">
        <section className="rounded-xl border border-gray-600 bg-gray-800 p-4 md:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">This Month's Records</h2>
            <span className="text-xs text-gray-500">{transactions.length} items</span>
          </div>
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {transactions.length === 0 && <div className="rounded-lg border border-dashed border-gray-700 p-5 text-sm text-gray-500">No money records this month.</div>}
            {transactions.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 p-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                      {item.type}
                    </span>
                    <span className="truncate text-gray-200">{item.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{item.date} · {item.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold ${item.type === 'income' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 text-gray-400 hover:text-red-300"
                    onClick={() => item.type === 'income' ? onDeleteIncome(item.id) : onDeleteExpense(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-600 bg-gray-800 p-5 shadow-2xl md:rounded-2xl md:p-6">
            <h2 className="mb-4 text-xl font-bold text-white">{moneyMode === 'income' ? 'Add Income' : 'Add Expense'}</h2>
            <div className="space-y-4">
              <input
                type="text"
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder={moneyMode === 'income' ? 'e.g. Salary' : 'e.g. Lunch'}
                value={moneyForm.title}
                onChange={(event) => setMoneyForm({ ...moneyForm, title: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="Amount"
                  value={moneyForm.amount || ''}
                  onChange={(event) => setMoneyForm({ ...moneyForm, amount: parseFloat(event.target.value) || 0 })}
                />
                <input
                  type="date"
                  className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                  value={moneyForm.date}
                  onChange={(event) => setMoneyForm({ ...moneyForm, date: event.target.value })}
                />
              </div>
              <select
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                value={moneyForm.category}
                onChange={(event) => setMoneyForm({ ...moneyForm, category: event.target.value })}
              >
                {(moneyMode === 'income' ? DEFAULT_INCOME_CATEGORIES : expenseEnvelopeOptions).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="ghost" onClick={() => setShowMoneyModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={saveMoney} disabled={!moneyForm.title || moneyForm.amount <= 0}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-600 bg-gray-800 p-5 shadow-2xl md:rounded-2xl md:p-6">
            <h2 className="mb-4 text-xl font-bold text-white">{allocationForm.id ? 'Edit Envelope' : 'Add Envelope'}</h2>
            <div className="space-y-4">
              <input
                list="allocation-categories"
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder="Category"
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
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder="Planned amount"
                value={allocationForm.plannedAmount || ''}
                onChange={(event) => setAllocationForm({ ...allocationForm, plannedAmount: parseFloat(event.target.value) || 0 })}
              />
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="ghost" onClick={() => setShowAllocationModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={saveAllocation} disabled={!allocationForm.category || allocationForm.plannedAmount <= 0}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatCard = ({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'emerald' | 'red' | 'blue' | 'amber' | 'violet' }) => {
  const toneClasses = {
    emerald: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
    red: 'text-red-300 border-red-500/20 bg-red-500/10',
    blue: 'text-blue-300 border-blue-500/20 bg-blue-500/10',
    amber: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
    violet: 'text-violet-300 border-violet-500/20 bg-violet-500/10',
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</span>
        {label === 'Income' ? <Wallet size={16} /> : label === 'Expense' ? <DollarSign size={16} /> : <TrendingUp size={16} />}
      </div>
      <div className="mt-2 truncate text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{sub}</div>
    </div>
  );
};
