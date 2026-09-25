import { useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { SettingsContext } from '@/contexts/SettingsContext';

/**
 * localStorageから保存されたテーマ設定を同期的に読み取る
 * Web環境ではAsyncStorageがlocalStorageを使用するため、直接アクセス可能
 */
function getInitialColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    // AsyncStorageはWeb環境ではlocalStorageを使用
    // キー名は実装によって異なる可能性があるため、両方を試す
    let savedColorScheme: string | null = null;
    
    // まずプレフィックスなしで試す（一般的なケース）
    savedColorScheme = localStorage.getItem('colorScheme');
    
    // プレフィックス付きで試す（一部の実装）
    if (!savedColorScheme) {
      const asyncStoragePrefix = '@react-native-async-storage/async-storage:';
      savedColorScheme = localStorage.getItem(asyncStoragePrefix + 'colorScheme');
    }
    
    if (savedColorScheme === 'light' || savedColorScheme === 'dark') {
      return savedColorScheme;
    }
    
    // 'auto'の場合はシステム設定を参照
    if (savedColorScheme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    
    // 保存された設定がない場合はシステム設定を参照
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (error) {
    // localStorageへのアクセスに失敗した場合はライトモードをデフォルトとする
    return 'light';
  }
}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' | null {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [initialScheme] = useState(() => getInitialColorScheme());
  const settings = useContext(SettingsContext);
  const systemScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // クライアント側でハイドレーション後はユーザー設定を最優先
  if (hasHydrated && settings) {
    return settings.actualColorScheme;
  }

  // 設定コンテキストが使えない場合はシステム設定を返す
  if (hasHydrated) {
    const normalizedSystemScheme: 'light' | 'dark' | null = systemScheme ?? null;
    return normalizedSystemScheme;
  }

  // 事前描画中はlocalStorageから読み取った初期値を返す（フラッシュ抑制）
  return initialScheme;
}
