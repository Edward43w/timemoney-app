import React from 'react';
import { signInWithGoogle } from '../authService';
import { Button } from './Button';
import { LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('登入失敗:', error);
      
      if (error.message?.includes('開發環境限制')) {
        alert('⚠️ 開發環境限制\n\n' +
              '由於瀏覽器安全政策，Google 登入在 localhost 無法使用。\n\n' +
              '請在正式部署的網站上測試登入功能：\n' +
              'https://edward43w.github.io/timemoney-app/');
      } else {
        alert('登入失敗：' + (error.message || '未知錯誤'));
      }
    }
  };



  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">TM</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TimeMoney</h1>
          <p className="text-gray-400">智慧型時間與金錢管理</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            登入以保護您的資料
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              個人資料隔離保護
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              雲端同步備份
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              跨裝置使用
            </div>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <LogIn size={20} />
            <span>使用 Google 登入</span>
          </Button>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              🔒 安全登入 • ☁️ 雲端同步 • 📱 跨裝置使用
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            登入後您的所有資料將安全地儲存在個人帳戶中
          </p>
        </div>
      </div>
    </div>
  );
};