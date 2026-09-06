import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MoneyEntryModal } from '../../components/MoneyEntryModal';
import { makeAllocation } from '../fixtures';

const renderModal = () => {
  const props = {
    allocations: [
      makeAllocation({ id: 'food-july', category: 'Food', month: '2026-07' }),
      makeAllocation({ id: 'living-july', category: 'Living', month: '2026-07' }),
      makeAllocation({ id: 'travel-august', category: 'Travel', month: '2026-08' }),
    ],
    expenseCategories: ['Legacy category'],
    onAddExpense: vi.fn(),
    onAddIncome: vi.fn(),
    onClose: vi.fn(),
  };

  return { props, ...render(<MoneyEntryModal {...props} />) };
};

describe('MoneyEntryModal', () => {
  it('adds an expense using the selected month budget categories', () => {
    const { props } = renderModal();
    const dialog = screen.getByRole('dialog', { name: '新增收支' });

    fireEvent.change(within(dialog).getByRole('textbox', { name: '支出名稱' }), { target: { value: '晚餐' } });
    fireEvent.change(within(dialog).getByLabelText('日期'), { target: { value: '2026-07-22' } });
    const category = within(dialog).getByRole('combobox', { name: '分類' });
    expect(within(category).getByRole('option', { name: 'Food' })).toBeInTheDocument();
    expect(within(category).getByRole('option', { name: 'Living' })).toBeInTheDocument();
    expect(within(category).queryByRole('option', { name: 'Legacy category' })).not.toBeInTheDocument();

    fireEvent.change(within(dialog).getByRole('spinbutton', { name: '金額' }), { target: { value: '250' } });
    fireEvent.change(category, { target: { value: 'Living' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '新增支出' }));

    expect(props.onAddExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: '晚餐',
      amount: 250,
      category: 'Living',
      date: '2026-07-22',
    }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the same shared form to add income', () => {
    const { props } = renderModal();
    const dialog = screen.getByRole('dialog', { name: '新增收支' });
    fireEvent.click(within(dialog).getByRole('button', { name: '收入' }));
    fireEvent.change(within(dialog).getByRole('textbox', { name: '收入名稱' }), { target: { value: '接案' } });
    fireEvent.change(within(dialog).getByLabelText('日期'), { target: { value: '2026-07-22' } });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: '金額' }), { target: { value: '3000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '新增收入' }));

    expect(props.onAddIncome).toHaveBeenCalledWith(expect.objectContaining({
      title: '接案',
      amount: 3000,
      category: 'Food',
    }));
  });

  it('updates categories when the selected date changes month and closes with Escape', () => {
    const { props } = renderModal();
    const dialog = screen.getByRole('dialog', { name: '新增收支' });
    fireEvent.change(within(dialog).getByLabelText('日期'), { target: { value: '2026-08-05' } });
    const category = within(dialog).getByRole('combobox', { name: '分類' });
    expect(within(category).getByRole('option', { name: 'Travel' })).toBeInTheDocument();
    expect(within(category).queryByRole('option', { name: 'Food' })).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
