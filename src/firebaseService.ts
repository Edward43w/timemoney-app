import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  setDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Expense, Budget } from './types';

// 集合名稱
const COLLECTIONS = {
  TASKS: 'tasks',
  EXPENSES: 'expenses',
  BUDGETS: 'budgets'
} as const;

// === 任務相關函數 ===

// 新增任務
export const addTask = async (task: Omit<Task, 'id'>) => {
  try {
    console.log('Adding task to Firebase:', task); // Debug log
    
    // Remove undefined values to avoid Firebase errors
    const cleanTask = Object.fromEntries(
      Object.entries(task).filter(([_, value]) => value !== undefined)
    );
    console.log('Cleaned task data:', cleanTask); // Debug log
    
    const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
      ...cleanTask,
      createdAt: Timestamp.now()
    });
    
    console.log('Task added successfully with ID:', docRef.id); // Debug log
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
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
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
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// 監聽任務變化
export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, COLLECTIONS.TASKS), orderBy('createdAt', 'desc'));
  
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
};

// === 費用相關函數 ===

// 新增費用
export const addExpense = async (expense: Omit<Expense, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.EXPENSES), {
      ...expense,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// 監聽費用變化
export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  const q = query(collection(db, COLLECTIONS.EXPENSES), orderBy('date', 'desc'));
  
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
};

// === 預算相關函數 ===

// 更新預算
export const updateBudget = async (budget: Budget) => {
  try {
    const budgetRef = doc(db, COLLECTIONS.BUDGETS, 'default');
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
  const budgetRef = doc(db, COLLECTIONS.BUDGETS, 'default');
  
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