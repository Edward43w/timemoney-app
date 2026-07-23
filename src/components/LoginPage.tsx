import React, { useState } from 'react';
import { CalendarClock, Clock3, LogIn, ShieldCheck, WalletCards } from 'lucide-react';
import { signInWithGoogle } from '../authService';
import { Button } from './Button';

export const LoginPage: React.FC = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage('');

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error('Sign-in failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '目前無法登入，請稍後再試。');
    } finally {
      setIsSigningIn(false);
    }
  };

  const productPillars = [
    { icon: CalendarClock, term: '排程', detail: '日、週、月視圖' },
    { icon: WalletCards, term: '財務', detail: '收支與預算信封' },
    { icon: ShieldCheck, term: '同步', detail: '私人雲端資料' },
  ];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0b0d10] px-5 py-8 text-gray-100 md:px-10 md:py-12">
      <div className="pointer-events-none absolute -left-24 top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-amber-300/[0.06] blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-stretch overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#101318]/95 shadow-[0_28px_90px_rgba(0,0,0,0.38)] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between p-7 md:p-12 lg:p-14">
          <div>
            <div className="mb-16 flex items-center gap-3 md:mb-24">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-300/30 bg-amber-300/10 text-amber-200">
                <Clock3 size={20} strokeWidth={1.8} />
              </div>
              <div>
                <div className="font-semibold tracking-[-0.02em] text-white">TimeMoney</div>
                <div className="text-[11px] tracking-[0.12em] text-gray-500">時間與金錢，放在同一張圖上</div>
              </div>
            </div>

            <p className="mb-5 text-xs font-semibold tracking-[0.16em] text-amber-200/80">每天真正重要的兩種資源</p>
            <h1 className="max-w-xl text-pretty text-4xl font-semibold leading-[1.14] tracking-[-0.04em] text-white md:text-5xl">
              把每一天安排好，<br className="hidden sm:block" />更把每一分錢掌握好。
            </h1>
            <p className="mt-6 max-w-[54ch] text-pretty text-base leading-7 text-gray-400 md:text-lg">
              安排任務、記下收支，讓時間投入與現金流都清楚可見。
            </p>
          </div>

          <dl className="mt-14 grid gap-4 border-t border-white/[0.08] pt-6 sm:grid-cols-3">
            {productPillars.map(({ icon: Icon, term, detail }) => (
              <div key={term} className="flex items-start gap-3">
                <Icon className="mt-0.5 text-amber-200/70" size={17} strokeWidth={1.7} />
                <div>
                  <dt className="text-sm font-semibold text-gray-200">{term}</dt>
                  <dd className="mt-0.5 text-xs text-gray-500">{detail}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex items-center border-t border-white/[0.08] bg-[#0d1014] p-7 md:p-12 lg:border-l lg:border-t-0">
          <div className="w-full">
            <p className="text-xs font-semibold tracking-[0.14em] text-gray-500">私人工作區</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-white">登入 TimeMoney</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">
              使用 Google 帳戶登入，你的任務與財務資料只會同步到自己的帳戶。
            </p>

            {errorMessage && (
              <div role="alert" className="mt-6 rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-sm text-red-200">
                登入失敗：{errorMessage}
              </div>
            )}

            <Button onClick={handleLogin} disabled={isSigningIn} className="mt-8 w-full py-3">
              <LogIn size={18} strokeWidth={1.8} />
              <span>{isSigningIn ? '正在登入…' : '使用 Google 繼續'}</span>
            </Button>

            <p className="mt-4 text-center text-xs leading-5 text-gray-600">
              繼續即表示你同意讓 TimeMoney 讀取登入所需的基本帳戶資訊。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
