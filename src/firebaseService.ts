import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Task, Expense, Budget, DEFAULT_EXPENSE_CATEGORIES } from './types';

// 獲取當前用戶 ID
const getCurrentUserId = (): string | null => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

// 集合名稱（加入用戶 ID 隔離）
const getUserCollection = (baseCollection: string): string => {
  const userId = getCurrentUserId();
  if (!userId) {
    // 如果用戶未登入，使用預設集合（向後兼容）
    return baseCollection;
  }
  return `users/${userId}/${baseCollection}`;
};

// === 任務相關函數 ===

// 新增任務
export const addTask = async (task: Omit<Task, 'id'>) => {
  try {
    // Remove undefined values to avoid Firebase errors
    const cleanTask = Object.fromEntries(
      Object.entries(task).filter((entry) => entry[1] !== undefined)
    );
    
    const docRef = await addDoc(collection(db, getUserCollection('tasks')), {
      ...cleanTask,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding task:', error);
    console.error('Task data that failed:', task);
    throw error;
  }
};

// 更新任務
export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  try {
    const taskRef = doc(db, getUserCollection('tasks'), taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// 刪除任務
export const deleteTask = async (taskId: string) => {
  try {
    const taskRef = doc(db, getUserCollection('tasks'), taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// 監聽任務變化
export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  try {
    const q = query(collection(db, getUserCollection('tasks')), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        } as Task);
      });
      callback(tasks);
    });
  } catch (error) {
    console.error('Error subscribing to tasks:', error);
    // 如果用戶未登入，返回空陣列
    callback([]);
    return () => {}; // 返回空的 unsubscribe 函數
  }
};

// === 費用相關函數 ===

// 新增費用
export const addExpense = async (expense: Omit<Expense, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, getUserCollection('expenses')), {
      ...expense,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// 刪除費用
export const deleteExpense = async (expenseId: string) => {
  try {
    await deleteDoc(doc(db, getUserCollection('expenses'), expenseId));
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// 監聽費用變化
export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  try {
    const q = query(collection(db, getUserCollection('expenses')), orderBy('date', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        expenses.push({
          id: doc.id,
          ...doc.data()
        } as Expense);
      });
      callback(expenses);
    });
  } catch (error) {
    console.error('Error subscribing to expenses:', error);
    callback([]);
    return () => {};
  }
};

// === 預算相關函數 ===

// 更新預算
export const updateBudget = async (budget: Budget) => {
  try {
    const budgetRef = doc(db, getUserCollection('budgets'), 'default');
    await setDoc(budgetRef, {
      ...budget,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

// 監聽預算變化
export const subscribeToBudget = (callback: (budget: Budget) => void) => {
  const budgetRef = doc(db, getUserCollection('budgets'), 'default');
  
  return onSnapshot(budgetRef, async (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Budget);
    } else {
      // 如果沒有預算文檔，建立預設的
      const defaultBudget = { daily: 50, weekly: 300, monthly: 1200 };
      try {
        await updateBudget(defaultBudget);
        callback(defaultBudget);
      } catch (error) {
        console.error('Error creating default budget:', error);
        // 即使建立失敗，也回傳預設值讓應用程式正常運作
        callback(defaultBudget);
      }
    }
  });
};

export const updateExpenseCategories = async (categories: string[]) => {
  const settingsRef = doc(db, getUserCollection('settings'), 'expenseCategories');
  const cleanCategories = categories
    .map((category) => category.trim())
    .filter((category, index, source) => category && source.indexOf(category) === index);

  await setDoc(settingsRef, {
    categories: cleanCategories.length > 0 ? cleanCategories : DEFAULT_EXPENSE_CATEGORIES,
    updatedAt: Timestamp.now()
  }, { merge: true });
};

export const subscribeToExpenseCategories = (callback: (categories: string[]) => void) => {
  const settingsRef = doc(db, getUserCollection('settings'), 'expenseCategories');

  return onSnapshot(settingsRef, async (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const categories = Array.isArray(data.categories) ? data.categories.filter((category) => typeof category === 'string') : [];
      callback(categories.length > 0 ? categories : DEFAULT_EXPENSE_CATEGORIES);
    } else {
      try {
        await updateExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      } catch (error) {
        console.error('Error creating default expense categories:', error);
      }
      callback(DEFAULT_EXPENSE_CATEGORIES);
    }
  });
};
