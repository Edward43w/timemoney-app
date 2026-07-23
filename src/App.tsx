import React, { lazy, Suspense, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Calendar as CalendarIcon, Clock3, Wallet, ListTodo, Menu, X, LogOut, Timer } from 'lucide-react';
import { Allocation, Task, Expense, Income, ViewMode, DEFAULT_EXPENSE_CATEGORIES, PomodoroSession } from './types';
import { CalendarView } from './components/CalendarView';
import { TaskList } from './components/TaskList';
import { LoginPage } from './components/LoginPage';
import { Button } from './components/Button';
import { 
  subscribeToTasks, 
  subscribeToExpenses, 
  subscribeToIncomes,
  subscribeToAllocations,
  subscribeToExpenseCategories,
  subscribeToPomodoroSessions,
  addTask as firebaseAddTask,
  updateTask as firebaseUpdateTask,
  deleteTask as firebaseDeleteTask,
  addExpense as firebaseAddExpense,
  deleteExpense as firebaseDeleteExpense,
  addIncome as firebaseAddIncome,
  deleteIncome as firebaseDeleteIncome,
  addAllocation as firebaseAddAllocation,
  updateAllocation as firebaseUpdateAllocation,
  deleteAllocation as firebaseDeleteAllocation,
  updateExpenseCategories as firebaseUpdateExpenseCategories,
  addPomodoroSession as firebaseAddPomodoroSession,
  deletePomodoroSession as firebaseDeletePomodoroSession
} from './firebaseService';
import { onAuthChange, signOut } from './authService';
import { getEndTimeFromDuration } from './taskFormUtils';

const FinanceDashboard = lazy(() => import('./components/FinanceDashboard').then((module) => ({
  default: module.FinanceDashboard,
})));

const FocusDashboard = lazy(() => import('./components/FocusDashboard').then((module) => ({
  default: module.FocusDashboard,
})));

const DashboardLoadingState = () => (
  <div className="h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101318] p-4 md:p-6" aria-label="正在載入頁面" aria-busy="true">
    <div className="mb-5 h-16 animate-pulse rounded-xl bg-white/[0.05]" />
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 animate-pulse rounded-xl bg-white/[0.04]" />
      <div className="h-72 animate-pulse rounded-xl bg-white/[0.04]" />
    </div>
    <span className="sr-only">正在載入功能頁面</span>
  </div>
);

const App: React.FC = () => {
  // --- Authentication State ---
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- State ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'focus'>('calendar');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For desktop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Firebase 即時資料
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);

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
      return;
    }

    // 監聽任務變化
    const unsubscribeTasks = subscribeToTasks(setTasks);
    
    // 監聽費用變化
    const unsubscribeExpenses = subscribeToExpenses(setExpenses);
    const unsubscribeIncomes = subscribeToIncomes(setIncomes);
    const unsubscribeAllocations = subscribeToAllocations(setAllocations);
    
    // 監聽預算變化
    const unsubscribeExpenseCategories = subscribeToExpenseCategories(setExpenseCategories);
    const unsubscribePomodoroSessions = subscribeToPomodoroSessions(setPomodoroSessions);

    // 清理函數
    return () => {
      unsubscribeTasks();
      unsubscribeExpenses();
      unsubscribeIncomes();
      unsubscribeAllocations();
      unsubscribeExpenseCategories();
      unsubscribePomodoroSessions();
    };
  }, [user]);

  // --- Firebase 操作函數 ---
  const handleAddTask = async (task: Task) => {
    try {
      // 移除 id，因為 Firestore 會自動生成
      const { id, ...taskWithoutId } = task;
      void id;
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
      void id;
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

  const handleAddIncome = async (income: Income) => {
    try {
      const { id, ...incomeWithoutId } = income;
      void id;
      await firebaseAddIncome(incomeWithoutId);
    } catch (error) {
      console.error('Failed to add income:', error);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      await firebaseDeleteIncome(incomeId);
    } catch (error) {
      console.error('Failed to delete income:', error);
    }
  };

  const handleAddAllocation = async (allocation: Allocation) => {
    try {
      const { id, ...allocationWithoutId } = allocation;
      void id;
      await firebaseAddAllocation(allocationWithoutId);
    } catch (error) {
      console.error('Failed to add allocation:', error);
    }
  };

  const handleUpdateAllocation = async (allocation: Allocation) => {
    try {
      await firebaseUpdateAllocation(allocation.id, allocation);
    } catch (error) {
      console.error('Failed to update allocation:', error);
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    try {
      await firebaseDeleteAllocation(allocationId);
    } catch (error) {
      console.error('Failed to delete allocation:', error);
    }
  };

  const handleUpdateExpenseCategories = async (categories: string[]) => {
    try {
      await firebaseUpdateExpenseCategories(categories);
    } catch (error) {
      console.error('Failed to update expense categories:', error);
    }
  };

  const handleAddPomodoroSession = async (session: PomodoroSession) => {
    try {
      const { id, ...sessionWithoutId } = session;
      void id;
      await firebaseAddPomodoroSession(sessionWithoutId);
    } catch (error) {
      console.error('Failed to add pomodoro session:', error);
    }
  };

  const handleDeletePomodoroSession = async (sessionId: string) => {
    try {
      await firebaseDeletePomodoroSession(sessionId);
    } catch (error) {
      console.error('Failed to delete pomodoro session:', error);
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
        handleUpdateTask({
          ...task,
          date,
          time: time || undefined,
          endTime: time ? getEndTimeFromDuration(time, task.durationMinutes) : undefined,
        });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0d10] px-6" aria-live="polite" aria-busy="true">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.08]" />
            <div className="space-y-2">
              <div className="h-3 w-28 animate-pulse rounded bg-white/[0.08]" />
              <div className="h-2 w-20 animate-pulse rounded bg-white/[0.05]" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
              <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
              <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
            </div>
          </div>
          <span className="sr-only">正在載入 TimeMoney</span>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden bg-[#0b0d10] font-sans text-gray-200">
      
      {/* Sidebar (Desktop) */}
      <aside className={`hidden shrink-0 flex-col overflow-hidden bg-[#101318] transition-[width,border-color] duration-300 md:flex ${isSidebarOpen ? 'w-80 border-r border-white/[0.08]' : 'w-0 border-r border-transparent'}`}>
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
      <main id="main-content" className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        
        {/* Header */}
        <header className="z-20 grid min-h-16 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-white/[0.08] bg-[#0b0d10]/90 px-3 backdrop-blur-xl md:px-5">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-gray-100 md:hidden"
              aria-label="Open task list"
            >
               <Menu size={20} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-gray-100 md:block"
              aria-label="Toggle task sidebar"
              aria-pressed={isSidebarOpen}
            >
               <ListTodo size={20} />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/10 text-amber-200">
                <Clock3 size={16} strokeWidth={1.8} />
              </div>
              <div className="truncate text-sm font-semibold tracking-[-0.02em] text-gray-100 md:text-base">TimeMoney</div>
            </div>
          </div>

          <nav className="justify-self-center" aria-label="主要功能">
            <div className="flex shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.035] p-1">
              <button 
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all md:px-3 ${activeTab === 'calendar' ? 'bg-amber-300 text-gray-950 shadow-sm' : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-200'}`}
                  aria-pressed={activeTab === 'calendar'}
              >
                  <CalendarIcon size={14} className="md:h-4 md:w-4" /> <span>行事曆</span>
              </button>
              <button 
                  onClick={() => setActiveTab('finance')}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all md:px-3 ${activeTab === 'finance' ? 'bg-amber-300 text-gray-950 shadow-sm' : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-200'}`}
                  aria-pressed={activeTab === 'finance'}
              >
                  <Wallet size={14} className="md:h-4 md:w-4" /> <span>財務</span>
              </button>
              <button
                  onClick={() => setActiveTab('focus')}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all md:px-3 ${activeTab === 'focus' ? 'bg-amber-300 text-gray-950 shadow-sm' : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-200'}`}
                  aria-pressed={activeTab === 'focus'}
              >
                  <Timer size={14} className="md:h-4 md:w-4" /> <span>專注</span>
              </button>
            </div>
          </nav>

            <div className="flex shrink-0 items-center justify-self-end gap-2">
              <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 text-xs"
                aria-label="登出"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">登出</span>
              </Button>
            </div>
        </header>

        {/* Scrollable Body */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0b0d10] p-2 md:p-4">
           {activeTab === 'calendar' ? (
               <CalendarView 
                  viewMode={viewMode}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  tasks={tasks}
                  expenses={expenses}
                  incomes={incomes}
                  allocations={allocations}
                  expenseCategories={expenseCategories}
                  onUpdateExpenseCategories={handleUpdateExpenseCategories}
                  onTaskSchedule={handleScheduleTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteExpense={handleDeleteExpense}
                  onDeleteIncome={handleDeleteIncome}
                  onAddExpense={handleAddExpense}
                  onAddIncome={handleAddIncome}
                  onViewModeChange={setViewMode}
                  pomodoroSessions={pomodoroSessions}
                  pomodoroStorageKey={`timemoney-pomodoro-${user.uid}`}
                  onAddPomodoroSession={handleAddPomodoroSession}
                  onDeletePomodoroSession={handleDeletePomodoroSession}
               />
           ) : (
               <Suspense fallback={<DashboardLoadingState />}>
                 {activeTab === 'finance' ? (
                   <FinanceDashboard
                      expenses={expenses}
                      incomes={incomes}
                      allocations={allocations}
                      onAddExpense={handleAddExpense}
                      onDeleteExpense={handleDeleteExpense}
                      onAddIncome={handleAddIncome}
                      onDeleteIncome={handleDeleteIncome}
                      onAddAllocation={handleAddAllocation}
                      onUpdateAllocation={handleUpdateAllocation}
                      onDeleteAllocation={handleDeleteAllocation}
                      expenseCategories={expenseCategories}
                      currentDate={currentDate}
                   />
                 ) : (
                   <FocusDashboard
                      sessions={pomodoroSessions}
                      currentDate={currentDate}
                      onDateChange={setCurrentDate}
                   />
                 )}
               </Suspense>
           )}
        </div>

      </main>

      {/* Mobile Drawer (Task List) */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="任務清單">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-xs flex-col border-r border-white/[0.08] bg-[#101318] shadow-2xl animate-slide-right">
                  <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] p-4">
                      <span className="text-lg font-semibold tracking-[-0.02em] text-white">任務清單</span>
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-white/[0.06] hover:text-white" onClick={() => setIsMobileMenuOpen(false)} aria-label="關閉任務清單"><X size={18} /></button>
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
