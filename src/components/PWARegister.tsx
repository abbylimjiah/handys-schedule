'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/handys-schedule/sw.js', { scope: '/handys-schedule/' })
        .catch((err) => console.log('SW 등록 실패', err));
    }

    // iOS 감지 (iOS는 beforeinstallprompt 이벤트 없음)
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    // @ts-expect-error standalone is iOS-specific
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return; // 이미 설치됨

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // 7일 후 다시 표시
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) return;
    }

    if (ios) {
      setIsIOS(true);
      setTimeout(() => setShowBanner(true), 3000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 md:p-4 bg-white border-t-2 border-amber-600 shadow-2xl safe-bottom">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <img src="/handys-schedule/icon-192.png" alt="opssp" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800">앱으로 설치하기</p>
          {isIOS ? (
            <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
              Safari 하단 <span className="inline-block">⬆️</span> 공유 → <b>홈 화면에 추가</b>
            </p>
          ) : (
            <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
              홈화면에 추가하면 앱처럼 빠르게 사용할 수 있어요
            </p>
          )}
        </div>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="flex-shrink-0 px-3 py-2 bg-amber-700 text-white text-xs font-semibold rounded-lg hover:bg-amber-800"
          >
            설치
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
