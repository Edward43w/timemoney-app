import React, { lazy, Suspense, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Calendar as CalendarIcon, Clock3, Wallet, ListTodo, Menu, X, LogOut, Timer } from 'lucide-react';
import { Allocation, Task, Expense, Income, ViewMode, DEFAULT_EXPENSE_CATEGORIES, PomodoroSession } from './types';
import { CalendarView } from './components/CalendarView';
import { TaskList } from './components/TaskList';
import { LoginPage } from './components/LoginPage';
import { Button } from './components/Button';
import { MoneyEntryModal } from './components/MoneyEntryModal';
import { PomodoroExperience } from './components/PomodoroExperience';
import { QuickActionMenu } from './components/QuickActionMenu';
import { TaskFormModal } from './components/TaskFormModal';
import { IconButton } from './components/ui/IconButton';
import { SegmentedControl, SegmentedOption } from './components/ui/SegmentedControl';
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
  addPomodoroSession as firebaseAddPomodoroSession,
  deletePomodoroSession as firebaseDeletePomodoroSession
} from './firebaseService';
import { onAuthChange, signOut } from './authService';
import { DEFAULT_TASK_FORM, TaskFormState, formStateToTaskFields, getEndTimeFromDuration } from './taskFormUtils';
import { DEFAULT_TASK_COLOR } from './utils';

type AppTab = 'calendar' | 'finance' | 'focus';

const APP_TABS: SegmentedOption<AppTab>[] = [
  { value: 'calendar', label: '行事曆', icon: <CalendarIcon size={15} strokeWidth={1.8} /> },
  { value: 'finance', label: '財務', icon: <Wallet size={15} strokeWidth={1.8} /> },
  { value: 'focus', label: '專注', icon: <Timer size={15} strokeWidth={1.8} /> },
];

const FinanceDashboard = lazy(() => import('./components/FinanceDashboard').then((module) => ({
  default: module.FinanceDashboard,
})));

const FocusDashboard = lazy(() => import('./components/FocusDashboard').then((module) => ({
  default: module.FocusDashboard,
})));

const DashboardLoadingState = () => (
  <div className="h-full overflow-hidden rounded-frame bg-surface p-4 shadow-panel ring-1 ring-line/70 md:p-6" aria-label="正在載入頁面" aria-busy="true">
    <div className="mb-5 h-16 animate-pulse rounded-panel bg-surface-raised" />
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-panel bg-surface-raised" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 animate-pulse rounded-panel bg-surface-raised" />
      <div className="h-72 animate-pulse rounded-panel bg-surface-raised" />
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
  const [activeTab, setActiveTab] = useState<AppTab>('calendar');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For desktop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMoneyEntryModal, setShowMoneyEntryModal] = useState(false);
  const [showTaskEntryModal, setShowTaskEntryModal] = useState(false);
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<TaskFormState>(DEFAULT_TASK_FORM);

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

  const openTaskEntryModal = () => {
    setNewTaskForm(DEFAULT_TASK_FORM);
    setShowTaskEntryModal(true);
  };

  const submitTaskEntry = () => {
    if (!newTaskForm.title.trim()) return;
    void handleAddTask({
      id: '',
      ...formStateToTaskFields(newTaskForm),
      isCompleted: false,
      color: DEFAULT_TASK_COLOR,
    });
    setNewTaskForm(DEFAULT_TASK_FORM);
    setShowTaskEntryModal(false);
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
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-6" aria-live="polite" aria-busy="true">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-panel bg-surface-raised" />
            <div className="space-y-2">
              <div className="h-3 w-28 animate-pulse rounded-detail bg-surface-raised" />
              <div className="h-2 w-20 animate-pulse rounded-detail bg-surface" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-panel bg-surface" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 animate-pulse rounded-panel bg-surface" />
              <div className="h-16 animate-pulse rounded-panel bg-surface" />
              <div className="h-16 animate-pulse rounded-panel bg-surface" />
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
    <div className="flex h-dvh min-h-dvh overflow-hidden bg-canvas font-sans text-ink-soft">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        跳至主要內容
      </a>

      {/* Sidebar (Desktop) */}
      <aside className={`hidden shrink-0 flex-col overflow-hidden bg-canvas-raised transition-[width,border-color] duration-300 md:flex ${isSidebarOpen ? 'w-80 border-r border-line' : 'w-0 border-r border-transparent'}`}>
        {isSidebarOpen && (
            <TaskList 
                className="h-full border-none"
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
            />
        )}
      </aside>

      {/* Main Content */}
      <main id="main-content" className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        
        {/* Header */}
        <header className="z-20 grid min-h-16 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-line bg-canvas/90 px-3 backdrop-blur-xl md:px-5">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <IconButton
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden"
              aria-label="開啟任務清單"
            >
               <Menu size={20} />
            </IconButton>
            <IconButton
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:inline-grid"
              aria-label={isSidebarOpen ? '收合任務清單' : '展開任務清單'}
              aria-pressed={isSidebarOpen}
            >
               <ListTodo size={20} />
            </IconButton>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-control bg-accent-muted text-accent-strong ring-1 ring-accent/25">
                <Clock3 size={16} strokeWidth={1.8} />
              </div>
              <div className="truncate text-sm font-semibold tracking-[-0.025em] text-ink md:text-base">TimeMoney</div>
            </div>
          </div>

          <nav className="justify-self-center" aria-label="主要功能">
            <SegmentedControl<AppTab>
              value={activeTab}
              options={APP_TABS}
              onChange={setActiveTab}
              label="主要功能"
            />
          </nav>

            <div className="flex shrink-0 items-center justify-self-end gap-2">
              <span className="hidden max-w-44 truncate text-xs text-muted sm:block">{user.email}</span>
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
        <div className="relative min-h-0 flex-1 overflow-hidden bg-canvas p-2.5 md:p-4">
           {activeTab === 'calendar' ? (
               <CalendarView 
                  viewMode={viewMode}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  tasks={tasks}
                  expenses={expenses}
                  incomes={incomes}
                  onTaskSchedule={handleScheduleTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteExpense={handleDeleteExpense}
                  onDeleteIncome={handleDeleteIncome}
                  onViewModeChange={setViewMode}
                  pomodoroSessions={pomodoroSessions}
               />
           ) : (
               <Suspense fallback={<DashboardLoadingState />}>
                 {activeTab === 'finance' ? (
                   <FinanceDashboard
                      expenses={expenses}
                      incomes={incomes}
                      allocations={allocations}
                      onDeleteExpense={handleDeleteExpense}
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

      <QuickActionMenu
        onAddTask={openTaskEntryModal}
        onAddMoney={() => setShowMoneyEntryModal(true)}
        onStartFocus={() => setShowPomodoroModal(true)}
      />

      {showTaskEntryModal && (
        <TaskFormModal
          title="新增任務"
          description="先設定需要的時間，需要時再放進行事曆。"
          value={newTaskForm}
          onChange={setNewTaskForm}
          onClose={() => setShowTaskEntryModal(false)}
          onSubmit={submitTaskEntry}
          submitLabel="新增任務"
        />
      )}

      {showMoneyEntryModal && (
        <MoneyEntryModal
          allocations={allocations}
          expenseCategories={expenseCategories}
          onAddExpense={handleAddExpense}
          onAddIncome={handleAddIncome}
          onClose={() => setShowMoneyEntryModal(false)}
        />
      )}

      <PomodoroExperience
        key={user.uid}
        isOpen={showPomodoroModal}
        tasks={tasks}
        sessions={pomodoroSessions}
        storageKey={`timemoney-pomodoro-${user.uid}`}
        onAddSession={handleAddPomodoroSession}
        onDeleteSession={handleDeletePomodoroSession}
        onOpen={() => setShowPomodoroModal(true)}
        onClose={() => setShowPomodoroModal(false)}
      />

      {/* Mobile Drawer (Task List) */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="任務清單">
              <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-xs animate-slide-right flex-col border-r border-line bg-canvas-raised shadow-float">
                  <div className="flex shrink-0 items-center justify-between border-b border-line p-4">
                      <span className="text-lg font-semibold tracking-[-0.025em] text-ink">任務清單</span>
                      <IconButton onClick={() => setIsMobileMenuOpen(false)} aria-label="關閉任務清單"><X size={18} /></IconButton>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <TaskList 
                        className="h-full border-none"
                        tasks={tasks}
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
