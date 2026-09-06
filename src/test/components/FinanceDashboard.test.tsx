import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseChartTooltip, FinanceDashboard } from '../../components/FinanceDashboard';
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
    onDeleteExpense: vi.fn(),
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
  it('renders the expense tooltip with readable dark-theme text', () => {
    render(<ExpenseChartTooltip active payload={[{ name: 'Food', value: 1590 }]} />);
    expect(screen.getByText('Food')).toHaveClass('text-ink-soft');
    expect(screen.getByText('$1,590')).toHaveClass('text-accent-strong');
  });

  it('calculates the selected month summary', () => {
    renderDashboard();
    expect(screen.getByText('$15,000')).toBeInTheDocument();
    expect(screen.getByText('$928')).toBeInTheDocument();
    expect(screen.getByText('$14,072')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('renders each summary metric as an individual card', () => {
    renderDashboard();
    const cashFlowCard = screen.getByText('淨現金流').closest('.rounded-xl');
    const incomeCard = screen.getAllByText('收入')[0].closest('.rounded-xl');
    expect(cashFlowCard).toHaveClass('border', 'bg-[#151a1f]');
    expect(incomeCard).toHaveClass('border', 'bg-[#12161b]');
    expect(cashFlowCard).not.toBe(incomeCard);
  });

  it('does not render duplicate income or expense entry buttons', () => {
    renderDashboard();
    expect(screen.queryByRole('button', { name: '收入' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '支出' })).not.toBeInTheDocument();
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
