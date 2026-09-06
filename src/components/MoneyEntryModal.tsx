import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { Allocation, DEFAULT_ALLOCATION_CATEGORIES, Expense, Income } from '../types';
import { formatDateISO, generateId } from '../utils';
import { Button } from './Button';
import { IconButton } from './ui/IconButton';
import { SegmentedControl, SegmentedOption } from './ui/SegmentedControl';

type MoneyEntryMode = 'expense' | 'income';

interface MoneyEntryModalProps {
  allocations: Allocation[];
  expenseCategories: string[];
  onAddExpense: (expense: Expense) => void;
  onAddIncome: (income: Income) => void;
  onClose: () => void;
}

const MODE_OPTIONS: SegmentedOption<MoneyEntryMode>[] = [
  { value: 'expense', label: '支出', icon: <ArrowUpRight size={15} strokeWidth={1.8} /> },
  { value: 'income', label: '收入', icon: <ArrowDownLeft size={15} strokeWidth={1.8} /> },
];

export const MoneyEntryModal: React.FC<MoneyEntryModalProps> = ({
  allocations,
  expenseCategories,
  onAddExpense,
  onAddIncome,
  onClose,
}) => {
  const [mode, setMode] = useState<MoneyEntryMode>('expense');
  const [form, setForm] = useState({
    title: '',
    amount: 0,
    category: '',
    date: formatDateISO(new Date()),
  });

  const categoryOptions = useMemo(() => {
    const monthKey = form.date.slice(0, 7);
    const allocationCategories = allocations
      .filter((allocation) => allocation.month === monthKey)
      .map((allocation) => allocation.category);
    const fallback = expenseCategories.length > 0 ? expenseCategories : DEFAULT_ALLOCATION_CATEGORIES;

    return Array.from(new Set(allocationCategories.length > 0 ? allocationCategories : fallback));
  }, [allocations, expenseCategories, form.date]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const selectedCategory = categoryOptions.includes(form.category)
    ? form.category
    : categoryOptions[0] || 'Other';
  const isValid = Boolean(form.title.trim() && form.amount > 0 && form.date && selectedCategory);

  const submitEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;

    const entry = {
      id: generateId(),
      title: form.title.trim(),
      amount: form.amount,
      category: selectedCategory,
      date: form.date,
    };

    if (mode === 'expense') onAddExpense(entry);
    else onAddIncome(entry);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="money-entry-title"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-frame bg-surface p-5 shadow-float ring-1 ring-line md:rounded-frame md:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="tm-kicker mb-1">收支記錄</div>
            <h2 id="money-entry-title" className="text-xl font-semibold tracking-[-0.025em] text-ink">新增收支</h2>
          </div>
          <IconButton onClick={onClose} aria-label="關閉新增收支">
            <X size={18} />
          </IconButton>
        </div>

        <SegmentedControl<MoneyEntryMode>
          value={mode}
          options={MODE_OPTIONS}
          onChange={setMode}
          label="收支類型"
          className="mb-5 grid w-full grid-cols-2"
        />

        <form className="space-y-4" onSubmit={submitEntry}>
          <label className="block space-y-1.5 text-xs font-medium text-muted">
            <span>名稱</span>
            <input
              type="text"
              aria-label={mode === 'expense' ? '支出名稱' : '收入名稱'}
              className="tm-field"
              placeholder={mode === 'expense' ? '例如：午餐' : '例如：薪資'}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              autoFocus
            />
          </label>

          <label className="block space-y-1.5 text-xs font-medium text-muted">
            <span>日期</span>
            <input
              type="date"
              aria-label="日期"
              className="tm-field"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-xs font-medium text-muted">
              <span>金額</span>
              <input
                type="number"
                aria-label="金額"
                min="0"
                step="0.01"
                className="tm-field"
                placeholder="0.00"
                value={form.amount || ''}
                onChange={(event) => setForm({ ...form, amount: parseFloat(event.target.value) || 0 })}
              />
            </label>
            <label className="block space-y-1.5 text-xs font-medium text-muted">
              <span>分類</span>
              <select
                aria-label="分類"
                className="tm-field"
                value={selectedCategory}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs leading-5 text-muted">分類會依日期同步該月份的預算分配。</p>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" variant="ghost" onClick={onClose}>取消</Button>
            <Button className="flex-1" type="submit" disabled={!isValid}>
              {mode === 'expense' ? '新增支出' : '新增收入'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
