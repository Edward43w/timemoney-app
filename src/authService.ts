import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error('Google sign-in failed:', error);

    const code = error instanceof FirebaseError ? error.code : '';
    const message = error instanceof Error ? error.message : '';

    if (
      code === 'auth/popup-blocked' ||
      message.includes('Cross-Origin-Opener-Policy') ||
      message.includes('popup')
    ) {
      throw new Error('The sign-in popup was blocked. Please allow popups and try again.');
    }

    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
