import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyASNZFSpcEM2LqPffIc_sS_iBYWKS46cAQ",
  authDomain: "timemoney-e1c70.firebaseapp.com",
  projectId: "timemoney-e1c70",
  storageBucket: "timemoney-e1c70.firebasestorage.app",
  messagingSenderId: "672723984102",
  appId: "1:672723984102:web:2729273c4ee79801006527",
  measurementId: "G-8YE7TVENXM"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore Database
export const db = getFirestore(app);

// 初始化 Authentication (目前未使用，但為未來準備)
export const auth = getAuth(app);

export default app;