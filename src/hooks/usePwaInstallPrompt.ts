import { useCallback, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptOutcome = 'accepted' | 'dismissed' | 'unavailable';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

const DISMISS_KEY = 'pwaInstallBannerDismissedAt';
const DISMISS_COOLDOWN_DAYS = 14;

/**
 * スタンドアロンモード（PWAとしてインストール済み）かどうかを判定
 */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  const nav = window.navigator as Navigator & { standalone?: boolean };
  
  // display-mode: standalone のチェック
  if (window.matchMedia?.('(display-mode: standalone)').matches === true) {
    return true;
  }
  
  // iOS Safariのstandalone判定
  if (nav.standalone === true) {
    return true;
  }
  
  // Androidのstandalone判定
  if (document.referrer.startsWith('android-app://')) {
    return true;
  }
  
  return false;
}

/**
 * クールダウン期間が経過したかどうかを判定
 */
function hasCooldownElapsed(): boolean {
  if (typeof window === 'undefined') return true;
  
  try {
    const raw = window.localStorage?.getItem(DISMISS_KEY);
    if (!raw) return true;
    
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return true;
    
    const diff = Date.now() - timestamp;
    const cooldownMs = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    return diff > cooldownMs;
  } catch (error) {
    // localStorageが利用できない場合は常にtrueを返す
    return true;
  }
}

/**
 * バナーを閉じた時刻を保存
 */
function storeDismissalTimestamp(): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage?.setItem(DISMISS_KEY, Date.now().toString());
  } catch (error) {
    // localStorageが利用できない場合は何もしない（プライベートモード等）
  }
}

/**
 * プラットフォームがbeforeinstallpromptイベントをサポートしているか
 */
function platformSupportsPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  return 'onbeforeinstallprompt' in window;
}

/**
 * iOS Safariかどうかを判定
 */
function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = isIOS && !/crios|fxios|edgios/.test(ua);
  
  return isSafari;
}

export interface UsePwaInstallPromptResult {
  showBanner: boolean;
  isInstallable: boolean;
  isIosManualInstall: boolean;
  promptInstall: () => Promise<BeforeInstallPromptOutcome>;
  dismissBanner: () => void;
}

/**
 * PWAインストールプロンプトを管理するフック
 */
export function usePwaInstallPrompt(): UsePwaInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => isStandalone());

  const iosManualInstall = useMemo(() => isIosSafari(), []);

  // beforeinstallpromptイベントのリスナー登録
  useEffect(() => {
    if (typeof window === 'undefined' || !platformSupportsPrompt()) {
      return;
    }

    const handler = (event: Event) => {
      // デフォルトのインストールプロンプトを防ぐ
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  // appinstalledイベントのリスナー登録
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // クールダウン期間の確認
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    setBannerDismissed(!hasCooldownElapsed());
  }, []);

  // スタンドアロンモードの再確認（ユーザーがインストールした場合）
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkStandalone = () => {
      if (isStandalone()) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };

    // 定期的にスタンドアロンモードをチェック
    const interval = setInterval(checkStandalone, 1000);
    
    // 初回チェック
    checkStandalone();

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * インストールプロンプトを表示
   */
  const promptInstall = useCallback(async (): Promise<BeforeInstallPromptOutcome> => {
    if (!deferredPrompt) {
      return 'unavailable';
    }

    try {
      // プロンプトを表示
      await deferredPrompt.prompt();
      
      // ユーザーの選択を待つ
      const choice = await deferredPrompt.userChoice;
      
      // プロンプトをクリア
      setDeferredPrompt(null);
      
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        return 'accepted';
      }
      
      if (choice.outcome === 'dismissed') {
        storeDismissalTimestamp();
        setBannerDismissed(true);
        return 'dismissed';
      }
      
      return 'dismissed';
    } catch (error) {
      console.error('PWA install prompt error:', error);
      return 'unavailable';
    }
  }, [deferredPrompt]);

  /**
   * バナーを閉じる
   */
  const dismissBanner = useCallback(() => {
    storeDismissalTimestamp();
    setBannerDismissed(true);
  }, []);

  // バナーを表示するかどうかの判定
  const shouldShowBanner = useMemo(() => {
    // 既にインストール済みの場合は表示しない
    if (isInstalled) {
      return false;
    }
    
    // クールダウン期間中は表示しない
    if (bannerDismissed) {
      return false;
    }
    
    // beforeinstallpromptイベントが発火したか、iOS Safariの場合は表示
    return deferredPrompt !== null || iosManualInstall;
  }, [isInstalled, bannerDismissed, deferredPrompt, iosManualInstall]);

  return {
    showBanner: shouldShowBanner,
    isInstallable: deferredPrompt !== null,
    isIosManualInstall: iosManualInstall && deferredPrompt === null,
    promptInstall,
    dismissBanner,
  };
}