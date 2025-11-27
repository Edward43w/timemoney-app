import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { LayoutDashboard, Calendar as CalendarIcon, Wallet, ListTodo, Menu, X, LogOut } from 'lucide-react';
import { Task, Expense, Budget, ViewMode } from './types';
import { CalendarView } from './components/CalendarView';
import { TaskList } from './components/TaskList';
import { FinanceDashboard } from './components/FinanceDashboard';
import { LoginPage } from './components/LoginPage';
import { Button } from './components/Button';
import { 
  subscribeToTasks, 
  subscribeToExpenses, 
  subscribeToBudget,
  addTask as firebaseAddTask,
  updateTask as firebaseUpdateTask,
  deleteTask as firebaseDeleteTask,
  addExpense as firebaseAddExpense,
  deleteExpense as firebaseDeleteExpense,
  updateBudget as firebaseUpdateBudget
} from './firebaseService';
import { onAuthChange, signOut } from './authService';

// Mock Data Initializers
const DEFAULT_BUDGET: Budget = { daily: 50, weekly: 300, monthly: 1200 };

const App: React.FC = () => {
  // --- Authentication State ---
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- State ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeTab, setActiveTab] = useState<'calendar' | 'finance'>('calendar');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For desktop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Firebase 即時資料
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget>(DEFAULT_BUDGET);

  // --- Authentication Effect ---
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Firebase 監聽器 ---
  useEffect(() => {
    if (!user) {
      // 如果未登入，清空資料
      setTasks([]);
      setExpenses([]);
      setBudget(DEFAULT_BUDGET);
      return;
    }

    // 監聽任務變化
    const unsubscribeTasks = subscribeToTasks(setTasks);
    
    // 監聽費用變化
    const unsubscribeExpenses = subscribeToExpenses(setExpenses);
    
    // 監聽預算變化
    const unsubscribeBudget = subscribeToBudget(setBudget);

    // 清理函數
    return () => {
      unsubscribeTasks();
      unsubscribeExpenses();
      unsubscribeBudget();
    };
  }, [user]);

  // --- Firebase 操作函數 ---
  const handleAddTask = async (task: Task) => {
    try {
      // 移除 id，因為 Firestore 會自動生成
      const { id, ...taskWithoutId } = task;
      await firebaseAddTask(taskWithoutId);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleUpdateTask = async (updated: Task) => {
    try {
      await firebaseUpdateTask(updated.id, updated);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await firebaseDeleteTask(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };
  
  const handleAddExpense = async (expense: Expense) => {
    try {
      // 移除 id，因為 Firestore 會自動生成
      const { id, ...expenseWithoutId } = expense;
      await firebaseAddExpense(expenseWithoutId);
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await firebaseDeleteExpense(expenseId);
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleUpdateBudget = async (newBudget: Budget) => {
    try {
      await firebaseUpdateBudget(newBudget);
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // 用戶狀態會通過 onAuthChange 自動更新
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // Quick schedule handler (Task List -> Calendar)
  const handleScheduleTask = (taskId: string, date: string, time: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        handleUpdateTask({ ...task, date, time });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex overflow-hidden">
      
      {/* Sidebar (Desktop) */}
      <aside className={`flex flex-col border-r border-gray-700 bg-gray-800 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-16'}`}>
        {isSidebarOpen && (
            <TaskList 
                className="h-full border-none"
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
            />
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header */}
        <header className="h-auto min-h-[64px] py-2 border-b border-gray-700 flex flex-wrap items-center justify-between px-4 bg-gray-900/80 backdrop-blur z-20 gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
               <ListTodo size={20} />
            </button>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent truncate">
              TimeMoney
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar max-w-full">
            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-600 shrink-0">
              <button 
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm transition-all ${activeTab === 'calendar' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <CalendarIcon size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Schedule</span>
              </button>
              <button 
                  onClick={() => setActiveTab('finance')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm transition-all ${activeTab === 'finance' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <Wallet size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Finance</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
              <Button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">登出</span>
              </Button>
            </div>

            {activeTab === 'calendar' && (
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-600 shrink-0">
                    {(['day', 'week', 'month'] as ViewMode[]).map(m => (
                        <button 
                          key={m}
                          onClick={() => setViewMode(m)}
                          className={`px-2 md:px-3 py-1 text-[10px] md:text-xs uppercase font-bold rounded transition-colors ${viewMode === m ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            )}
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-2 md:p-6 custom-scrollbar relative bg-gray-900">
           {activeTab === 'calendar' ? (
               <CalendarView 
                  viewMode={viewMode}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  tasks={tasks}
                  expenses={expenses}
                  budget={budget}
                  onTaskSchedule={handleScheduleTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteExpense={handleDeleteExpense}
                  onAddExpense={handleAddExpense}
                  onViewModeChange={setViewMode}
               />
           ) : (
               <FinanceDashboard 
                  expenses={expenses}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  budget={budget}
                  onUpdateBudget={handleUpdateBudget}
                  currentDate={currentDate}
               />
           )}
        </div>

      </main>

      {/* Mobile Drawer (Task List) */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-gray-800 shadow-2xl animate-slide-right flex flex-col">
                  <div className="p-4 flex justify-between items-center border-b border-gray-600 shrink-0">
                      <span className="font-bold text-lg text-white">My Tasks</span>
                      <button onClick={() => setIsMobileMenuOpen(false)}><X className="text-gray-400" /></button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <TaskList 
                        className="h-full border-none"
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                    />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;