import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { DEFAULT_TAB_LAYOUT, TAB_DEFINITIONS, TabId, TabLayoutItem } from '@/constants/Tabs';

export type ColorScheme = 'light' | 'dark' | 'auto';
export type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
export type StudentClass = 'A' | 'B' | 'C' | 'D';

export interface SettingsContextType {
  colorScheme: ColorScheme;
  accentColor: AccentColor;
  actualColorScheme: 'light' | 'dark';
  privacyPolicy: boolean;
  admissionYear: number | null;
  studentClass: StudentClass;
  grade: number; // 1-5
  gradeOffset: number; // -3..+3
  hasCompletedInitialSetup: boolean;
  tabLayout: TabLayoutItem[];
  setColorScheme: (scheme: ColorScheme) => void;
  setAccentColor: (color: AccentColor) => void;
  setPrivacyPolicy: (policy: boolean) => void;
  setAdmissionYear: (year: number | null) => void;
  setStudentClass: (cls: StudentClass) => void;
  setGrade: (grade: number) => void;
  setGradeOffset: (offset: number) => void;
  setTabLayout: (layout: TabLayoutItem[]) => void;
  isLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const accentColors = {
  blue: '#007AFF',
  green: '#34C759',
  purple: '#AF52DE',
  orange: '#FF9500',
  red: '#FF3B30',
  teal: '#5AC8FA',
} as const;

export const accentColorNames = {
  blue: 'ブルー',
  green: 'グリーン',
  purple: 'パープル',
  orange: 'オレンジ',
  red: 'レッド',
  teal: 'ティール',
} as const;

const tabDefinitionById = new Map<TabId, (typeof TAB_DEFINITIONS)[number]>(
  TAB_DEFINITIONS.map((tab) => [tab.id, tab]),
);

const pinnedTabIds = TAB_DEFINITIONS.filter((tab) => tab.isPinned).map((tab) => tab.id);
const pinnedTabIdSet = new Set<TabId>(pinnedTabIds);

const normalizeTabLayout = (layout: TabLayoutItem[]): TabLayoutItem[] => {
  const normalized: TabLayoutItem[] = [];
  const seen = new Set<TabId>();

  layout.forEach((item) => {
    if (!tabDefinitionById.has(item.id) || seen.has(item.id)) {
      return;
    }
    normalized.push({ id: item.id, visible: !!item.visible });
    seen.add(item.id);
  });

  TAB_DEFINITIONS.forEach((tab) => {
    if (!seen.has(tab.id)) {
      normalized.push({ id: tab.id, visible: true });
      seen.add(tab.id);
    }
  });

  const unpinned: TabLayoutItem[] = [];
  const pinned: TabLayoutItem[] = [];

  normalized.forEach((item) => {
    if (pinnedTabIdSet.has(item.id)) {
      pinned.push(item);
    } else {
      unpinned.push(item);
    }
  });

  return [...unpinned, ...pinned].map((item) => {
    const definition = tabDefinitionById.get(item.id);
    if (definition && !definition.canHide) {
      return { ...item, visible: true };
    }
    return item;
  });
};

export function SettingsProvider({ children, initialColorScheme }: { children: React.ReactNode; initialColorScheme?: ColorScheme }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (initialColorScheme) return initialColorScheme;
    try {
      const saved = localStorage.getItem('colorScheme') || localStorage.getItem('@react-native-async-storage/async-storage:colorScheme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* SSR or unavailable storage: follow the system. */ }
    return 'auto';
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [privacyPolicy, setPrivacyPolicyState] = useState(false);
  const [admissionYear, setAdmissionYearState] = useState<number | null>(null);
  const [studentClass, setStudentClassState] = useState<StudentClass>('B');
  const [grade, setGradeState] = useState<number>(1);
  const [gradeOffset, setGradeOffsetState] = useState<number>(0);
  const [hasCompletedInitialSetup, setHasCompletedInitialSetupState] = useState<boolean>(false);
  const [tabLayout, setTabLayoutState] = useState<TabLayoutItem[]>(() => normalizeTabLayout(DEFAULT_TAB_LAYOUT));
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useSystemColorScheme();

  // 実際に適用されるカラースキーム
  const actualColorScheme: 'light' | 'dark' = 
    colorScheme === 'auto' 
      ? (systemColorScheme ?? 'light') 
      : colorScheme;

  // 設定の保存
  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    try {
      await AsyncStorage.setItem('colorScheme', scheme);
    } catch (error) {
      console.error('色設定の保存に失敗しました:', error);
    }
  };

  const setAccentColor = async (color: AccentColor) => {
    setAccentColorState(color);
    try {
      await AsyncStorage.setItem('accentColor', color);
    } catch (error) {
      console.error('アクセントカラー設定の保存に失敗しました:', error);
    }
  };

  const setPrivacyPolicy = async (policy: boolean) => {
    setPrivacyPolicyState(policy);
    try {
      await AsyncStorage.setItem('privacyPolicy', policy.toString());
    } catch (error) {
      console.error('プライバシーポリシーの保存に失敗しました:', error);
    }
  };

  const setAdmissionYear = async (year: number | null) => {
    setAdmissionYearState(year);
    setHasCompletedInitialSetupState(true);
    try {
      await AsyncStorage.setItem('admissionYear', year === null ? 'null' : String(year));
      await AsyncStorage.setItem('hasCompletedInitialSetup', 'true');
    } catch (error) {
      console.error('入学年度の保存に失敗しました:', error);
    }
  };

  const setStudentClass = async (cls: StudentClass) => {
    setStudentClassState(cls);
    try {
      await AsyncStorage.setItem('studentClass', cls);
    } catch (error) {
      console.error('クラス設定の保存に失敗しました:', error);
    }
  };

  const setGrade = async (value: number) => {
    const clamped = Math.max(1, Math.min(5, value));
    setGradeState(clamped);
    try {
      await AsyncStorage.setItem('grade', String(clamped));
    } catch (error) {
      console.error('学年設定の保存に失敗しました:', error);
    }
  };

  const setGradeOffset = async (value: number) => {
    const clamped = Math.max(-3, Math.min(3, value));
    setGradeOffsetState(clamped);
    try {
      await AsyncStorage.setItem('gradeOffset', String(clamped));
    } catch (error) {
      console.error('学年調整の保存に失敗しました:', error);
    }
  };

  const setTabLayout = async (layout: TabLayoutItem[]) => {
    const normalized = normalizeTabLayout(layout);
    setTabLayoutState(normalized);
    try {
      await AsyncStorage.setItem('tabLayout', JSON.stringify(normalized));
    } catch (error) {
      console.error('タブ表示設定の保存に失敗しました:', error);
    }
  };

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedColorScheme, savedAccentColor, savedPrivacyPolicy, savedAdmissionYear, savedStudentClass, savedGrade, savedHasCompletedInitialSetup, savedGradeOffset, savedTabLayout] = await Promise.all([
          AsyncStorage.getItem('colorScheme'),
          AsyncStorage.getItem('accentColor'),
          AsyncStorage.getItem('privacyPolicy'),
          AsyncStorage.getItem('admissionYear'),
          AsyncStorage.getItem('studentClass'),
          AsyncStorage.getItem('grade'),
          AsyncStorage.getItem('hasCompletedInitialSetup'),
          AsyncStorage.getItem('gradeOffset'),
          AsyncStorage.getItem('tabLayout'),
        ]);

        if (savedColorScheme && ['light', 'dark', 'auto'].includes(savedColorScheme)) {
          setColorSchemeState(savedColorScheme as ColorScheme);
        }

        if (savedAccentColor && Object.keys(accentColors).includes(savedAccentColor)) {
          setAccentColorState(savedAccentColor as AccentColor);
        }
        if (savedPrivacyPolicy === 'true') {
          setPrivacyPolicyState(true);
        }
        else{
          setPrivacyPolicyState(false);
        }

        // 入学年度
        if (savedAdmissionYear) {
          if (savedAdmissionYear === 'null') {
            setAdmissionYearState(null);
          } else {
            const parsed = parseInt(savedAdmissionYear, 10);
            if (!Number.isNaN(parsed)) {
              setAdmissionYearState(parsed);
            }
          }
        }

        // クラス
        if (savedStudentClass && ['A','B','C','D'].includes(savedStudentClass)) {
          setStudentClassState(savedStudentClass as StudentClass);
        }

        // 学年
        if (savedGrade) {
          const parsedGrade = parseInt(savedGrade, 10);
          if (!Number.isNaN(parsedGrade)) {
            setGradeState(Math.max(1, Math.min(5, parsedGrade)));
          }
        }

        // 初期設定完了フラグ
        if (savedHasCompletedInitialSetup === 'true') {
          setHasCompletedInitialSetupState(true);
        }

        // 学年調整（オフセット）
        if (savedGradeOffset) {
          const parsedOffset = parseInt(savedGradeOffset, 10);
          if (!Number.isNaN(parsedOffset)) {
            setGradeOffsetState(Math.max(-3, Math.min(3, parsedOffset)));
          }
        }

        if (savedTabLayout) {
          try {
            const parsed = JSON.parse(savedTabLayout) as unknown;
            if (Array.isArray(parsed)) {
              const sanitized = parsed
                .map((item) => {
                  if (!item || typeof item !== 'object') {
                    return null;
                  }
                  const rawId = (item as { id?: unknown }).id;
                  if (typeof rawId !== 'string') {
                    return null;
                  }
                  const id = rawId as TabId;
                  if (!tabDefinitionById.has(id)) {
                    return null;
                  }
                  const visible = Boolean((item as { visible?: unknown }).visible);
                  return { id, visible } satisfies TabLayoutItem;
                })
                .filter((item): item is TabLayoutItem => Boolean(item));
              setTabLayoutState(normalizeTabLayout(sanitized));
            }
          } catch (error) {
            console.error('タブ表示設定の読み込みに失敗しました:', error);
          }
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const value: SettingsContextType = {
    colorScheme,
    accentColor,
    actualColorScheme,
    privacyPolicy,
    admissionYear,
    studentClass,
    grade,
    gradeOffset,
    hasCompletedInitialSetup,
    tabLayout,
    setColorScheme,
    setAccentColor,
    setPrivacyPolicy,
    setAdmissionYear,
    setStudentClass,
    setGrade,
    setGradeOffset,
    setTabLayout,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
