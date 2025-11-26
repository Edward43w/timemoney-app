import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from './firebase';

// Google 登入
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google 登入失敗:', error);
    
    // 檢查是否為 CORS 相關錯誤（僅開發環境）
    if (error.code === 'auth/popup-blocked' || 
        error.message?.includes('Cross-Origin-Opener-Policy') ||
        error.message?.includes('popup')) {
      throw new Error('開發環境限制：請在正式網站上測試登入功能');
    }
    
    throw error;
  }
};



// 登出
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('登出失敗:', error);
    throw error;
  }
};

// 監聽認證狀態
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};