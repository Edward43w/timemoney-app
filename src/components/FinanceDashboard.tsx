import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Expense, Budget, EXPENSE_CATEGORIES } from '../types';
import { formatCurrency, generateId, formatDateISO } from '../utils';
import { Button } from './Button';
import { Plus, DollarSign, Settings, TrendingUp, Trash2, History } from 'lucide-react';

interface FinanceDashboardProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  budget: Budget;
  onUpdateBudget: (budget: Budget) => void;
  currentDate: Date;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  budget,
  onUpdateBudget,
  currentDate
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Form State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ category: 'Food', date: formatDateISO(new Date()) });
  const [tempBudget, setTempBudget] = useState<Budget>(budget);

  // Calculations
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenses, currentMonth, currentYear]);

  const totalMonthlySpent = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = budget.monthly - totalMonthlySpent;
  const isOverBudget = remainingBudget < 0;

  // Chart Data
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [monthlyExpenses]);

  // Line Chart Data (Daily spending this month)
  const trendData = useMemo(() => {
    const days = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    for (let i = 1; i <= days; i++) {
        const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const spent = expenses
            .filter(e => e.date === dayStr)
            .reduce((acc, curr) => acc + curr.amount, 0);
        data.push({ day: i, amount: spent });
    }
    return data;
  }, [expenses, currentMonth, currentYear]);


  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.title && newExpense.amount && newExpense.date) {
      onAddExpense({
        id: generateId(),
        title: newExpense.title,
        amount: Number(newExpense.amount),
        category: newExpense.category || 'Other',
        date: newExpense.date,
      });
      setShowAddModal(false);
      setNewExpense({ category: 'Food', date: formatDateISO(new Date()), title: '', amount: 0 });
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-600 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-blue-500" />
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Monthly Spending</h3>
          <div className="text-3xl font-bold text-white mb-2">{formatCurrency(totalMonthlySpent)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className={isOverBudget ? "text-red-500" : "text-green-500"}>
              {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(remainingBudget))}
            </span>
            <span className="text-gray-500">
               {isOverBudget ? 'over budget' : 'remaining'}
            </span>
          </div>
          <div className="w-full bg-gray-700 h-1.5 mt-4 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-600'}`} 
              style={{ width: `${Math.min((totalMonthlySpent / budget.monthly) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-600 p-5 rounded-2xl flex items-center justify-between">
          <div>
             <h3 className="text-gray-400 text-sm font-medium mb-1">Budget Settings</h3>
             <p className="text-gray-500 text-xs">Set your daily/weekly/monthly limits</p>
          </div>
          <Button variant="secondary" onClick={() => setShowBudgetModal(true)}>
            <Settings size={18} />
          </Button>
        </div>
      </div>

      {/* Charts Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[300px]">
        {/* Pie Chart */}
        <div className="bg-gray-800 border border-gray-600 p-4 rounded-2xl flex flex-col">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            Spending by Category
          </h3>
          <div className="flex-1 min-h-[200px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <p>No expenses yet.</p>
                </div>
            )}
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-gray-800 border border-gray-600 p-4 rounded-2xl flex flex-col">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" />
                Monthly Trend
            </h3>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <RechartsTooltip 
                             contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} 
                        />
                        <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-600 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Add Expense</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
                  value={newExpense.title}
                  onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                  placeholder="e.g. Lunch"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Amount ($)</label>
                    <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                    placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <input 
                    type="date" 
                    required
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNewExpense({...newExpense, category: cat})}
                      className={`text-xs px-2 py-1.5 rounded-md transition-colors ${
                        newExpense.category === cat 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Add Expense</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-600 w-full max-w-sm rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Budget Settings</h2>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm text-gray-400 mb-1">Daily Budget</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2"
                    value={tempBudget.daily}
                    onChange={e => setTempBudget({...tempBudget, daily: Number(e.target.value)})}
                  />
               </div>
               <div>
                  <label className="block text-sm text-gray-400 mb-1">Weekly Budget</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2"
                    value={tempBudget.weekly}
                    onChange={e => setTempBudget({...tempBudget, weekly: Number(e.target.value)})}
                  />
               </div>
               <div>
                  <label className="block text-sm text-gray-400 mb-1">Monthly Budget</label>
                  <input 
                    type="number"
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2"
                    value={tempBudget.monthly}
                    onChange={e => setTempBudget({...tempBudget, monthly: Number(e.target.value)})}
                  />
               </div>
            </div>
            <div className="flex gap-2 mt-6">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowBudgetModal(false)}>Cancel</Button>
                <Button onClick={() => { onUpdateBudget(tempBudget); setShowBudgetModal(false); }} className="flex-1">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
