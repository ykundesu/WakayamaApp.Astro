/**
 * Centralized color palette for light and dark themes.
 * Adjust these tokens to keep visual consistency across the app.
 */

import { accentColors, AccentColor } from '@/contexts/SettingsContext';

const tintColorLight = '#2563EB'; // Indigo 600
const tintColorDark = '#38BDF8'; // Sky 400

// アクセントカラーを動的に取得する関数
export function getAccentColor(accentColor: AccentColor) {
  return accentColors[accentColor];
}

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceMuted: '#E2E8F0',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#D0D7E2',
    accent: tintColorLight,
    success: '#16A34A',
    warning: '#EA580C',
    error: '#DC2626',
  },
  dark: {
    text: '#E2E8F0',
    background: '#0B1120',
    surface: '#111C2F',
    surfaceMuted: '#1E293B',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    card: '#111C2F',
    border: 'rgba(148, 163, 184, 0.28)',
    accent: tintColorDark,
    success: '#22C55E',
    warning: '#F97316',
    error: '#F87171',
  },
};

export const classPeriodColors = {
  light: [
    { primary: '#F97316', secondary: '#FEEEDA' },
    { primary: '#10B981', secondary: '#DDF7EC' },
    { primary: '#0EA5E9', secondary: '#D9F0FB' },
    { primary: '#6366F1', secondary: '#E3E5FF' },
    { primary: '#F59E0B', secondary: '#FEF3C7' },
    { primary: '#EC4899', secondary: '#FCE7F3' },
  ],
  dark: [
    { primary: '#FDBA74', secondary: 'rgba(249, 115, 22, 0.18)' },
    { primary: '#34D399', secondary: 'rgba(52, 211, 153, 0.16)' },
    { primary: '#38BDF8', secondary: 'rgba(56, 189, 248, 0.18)' },
    { primary: '#A5B4FC', secondary: 'rgba(99, 102, 241, 0.18)' },
    { primary: '#FBBF24', secondary: 'rgba(251, 191, 36, 0.20)' },
    { primary: '#F472B6', secondary: 'rgba(236, 72, 153, 0.20)' },
  ],
};

export const mealTimePills = {
  breakfast: {
    light: { primary: '#F97316', secondary: 'rgba(249, 115, 22, 0.16)' },
    dark: { primary: '#FDBA74', secondary: 'rgba(251, 146, 60, 0.22)' },
  },
  lunch: {
    light: { primary: '#10B981', secondary: 'rgba(16, 185, 129, 0.16)' },
    dark: { primary: '#34D399', secondary: 'rgba(52, 211, 153, 0.20)' },
  },
  dinner: {
    light: { primary: '#0EA5E9', secondary: 'rgba(14, 165, 233, 0.16)' },
    dark: { primary: '#38BDF8', secondary: 'rgba(56, 189, 248, 0.22)' },
  },
};
