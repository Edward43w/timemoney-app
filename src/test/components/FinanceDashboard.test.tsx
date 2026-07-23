import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FinanceDashboard } from '../../components/FinanceDashboard';
import { makeAllocation, makeExpense, makeIncome } from '../fixtures';

vi.mock('recharts', () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Wrapper,
    PieChart: Wrapper,
    Pie: Wrapper,
    Cell: () => null,
    Legend: () => null,
    Tooltip: () => null,
  };
});

const renderDashboard = (overrides: Partial<React.ComponentProps<typeof FinanceDashboard>> = {}) => {
  const props: React.ComponentProps<typeof FinanceDashboard> = {
    expenses: [
      makeExpense({ id: 'food', title: '午餐', amount: 120, category: 'Food' }),
      makeExpense({ id: 'living', title: '房租', amount: 808, category: 'Living' }),
      makeExpense({ id: 'old', title: '上月支出', amount: 999, date: '2026-06-20' }),
    ],
    incomes: [makeIncome({ amount: 15000 })],
    allocations: [
      makeAllocation({ id: 'food-budget', category: 'Food', plannedAmount: 3000 }),
      makeAllocation({ id: 'living-budget', category: 'Living', plannedAmount: 12000 }),
    ],
    onAddExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
    onAddIncome: vi.fn(),
    onDeleteIncome: vi.fn(),
    onAddAllocation: vi.fn(),
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
    expenseCategories: ['Legacy category'],
    currentDate: new Date(2026, 6, 22),
    ...overrides,
  };
  return { props, ...render(<FinanceDashboard {...props} />) };
};

describe('FinanceDashboard', () => {
  it('calculates the selected month summary', () => {
    renderDashboard();
    expect(screen.getByText('$15,000')).toBeInTheDocument();
    expect(screen.getByText('$928')).toBeInTheDocument();
    expect(screen.getByText('$14,072')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('uses budget allocation categories for new expenses', () => {
    const { props } = renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: '支出' }));

    const dialog = screen.getByRole('dialog', { name: '新增支出' });
    const category = within(dialog).getByRole('combobox', { name: '分類' });
    expect(within(category).getByRole('option', { name: 'Food' })).toBeInTheDocument();
    expect(within(category).getByRole('option', { name: 'Living' })).toBeInTheDocument();
    expect(within(category).queryByRole('option', { name: 'Legacy category' })).not.toBeInTheDocument();

    fireEvent.change(within(dialog).getByRole('textbox', { name: '支出名稱' }), {
      target: { value: '晚餐' },
    });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: '金額' }), {
      target: { value: '250' },
    });
    fireEvent.change(category, { target: { value: 'Living' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '儲存' }));

    expect(props.onAddExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: '晚餐',
      amount: 250,
      category: 'Living',
      date: '2026-07-22',
    }));
  });

  it('uses the same allocation categories for income', () => {
    const { props } = renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: '收入' }));
    const dialog = screen.getByRole('dialog', { name: '新增收入' });

    fireEvent.change(within(dialog).getByRole('textbox', { name: '收入名稱' }), {
      target: { value: '接案' },
    });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: '金額' }), {
      target: { value: '3000' },
    });
    fireEvent.change(within(dialog).getByRole('combobox', { name: '分類' }), {
      target: { value: 'Food' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: '儲存' }));

    expect(props.onAddIncome).toHaveBeenCalledWith(expect.objectContaining({
      title: '接案',
      amount: 3000,
      category: 'Food',
    }));
  });

  it('filters the full transaction list by category and date', () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /查看本月與篩選/ }));
    const dialog = screen.getByRole('dialog', { name: '收支紀錄' });

    expect(within(dialog).getByText('符合條件：3 筆')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByRole('combobox', { name: '分類' }), {
      target: { value: 'Food' },
    });
    expect(within(dialog).getByText('符合條件：1 筆')).toBeInTheDocument();
    expect(within(dialog).getByText('午餐')).toBeInTheDocument();
    expect(within(dialog).queryByText('房租')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('上月支出')).not.toBeInTheDocument();
  });

  it('adds, edits and deletes budget allocations', () => {
    const onAddAllocation = vi.fn();
    const onUpdateAllocation = vi.fn();
    const onDeleteAllocation = vi.fn();
    renderDashboard({ onAddAllocation, onUpdateAllocation, onDeleteAllocation });

    fireEvent.click(screen.getByRole('button', { name: /新增分類/ }));
    let dialog = screen.getByRole('dialog', { name: '新增預算分配' });
    fireEvent.change(within(dialog).getByRole('combobox', { name: '預算分類' }), {
      target: { value: 'Learning' },
    });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: '規劃金額' }), {
      target: { value: '2000' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: '儲存' }));
    expect(onAddAllocation).toHaveBeenCalledWith(expect.objectContaining({
      category: 'Learning',
      plannedAmount: 2000,
      month: '2026-07',
    }));

    fireEvent.click(screen.getByRole('button', { name: '編輯 Food' }));
    dialog = screen.getByRole('dialog', { name: '編輯預算分配' });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: '規劃金額' }), {
      target: { value: '3500' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: '儲存' }));
    expect(onUpdateAllocation).toHaveBeenCalledWith(expect.objectContaining({
      id: 'food-budget',
      plannedAmount: 3500,
    }));

    fireEvent.click(screen.getByRole('button', { name: '刪除 Food' }));
    expect(onDeleteAllocation).toHaveBeenCalledWith('food-budget');
  });
});
