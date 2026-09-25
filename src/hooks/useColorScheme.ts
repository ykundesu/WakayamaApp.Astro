import { useContext } from 'react';
import { SettingsContext } from '@/contexts/SettingsContext';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' | null {
  const context = useContext(SettingsContext);
  const systemColorScheme = useSystemColorScheme();
  
  if (context) {
    return context.actualColorScheme;
  }
  
  // SettingsContextが利用できない場合はシステム設定を使用
  return systemColorScheme ?? null;
}
