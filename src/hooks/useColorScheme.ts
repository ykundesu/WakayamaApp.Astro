import { useContext } from 'react';
import { SettingsContext } from '@/contexts/SettingsContext';
import { useSystemTheme } from './useSystemTheme';

export function useColorScheme(): 'light' | 'dark' | null {
  const context = useContext(SettingsContext);
  const systemColorScheme = useSystemTheme();
  
  if (context) {
    return context.actualColorScheme;
  }
  
  // SettingsContextが利用できない場合はシステム設定を使用
  return systemColorScheme ?? null;
}
