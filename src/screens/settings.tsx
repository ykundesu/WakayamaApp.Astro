import React from 'react';
import { type Href, Stack, useRouter } from 'expo-router';
import { useTabTransition } from '@/hooks/useTabTransition';
import { StyleSheet, View, Switch, Linking, ActivityIndicator, Animated, Pressable, Platform, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { withAppName } from '@/constants/App';
import { APP_VERSION } from '@/constants/AppInfo';
import Icon from '@/components/ui/AppIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { TAB_DEFINITIONS, TabId } from '@/constants/Tabs';
import { Spacing, Radius, IconSize } from '@/constants/Design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings, accentColors, accentColorNames, ColorScheme, AccentColor, StudentClass } from '@/contexts/SettingsContext';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt';
import { SkeletonScreen } from '@/components/ui/SkeletonScreen';

const TAB_ROUTES: Record<TabId, Href> = {
  index: '/(tabs)',
  classes: '/(tabs)/classes',
  events: '/(tabs)/events',
  meals: '/(tabs)/meals',
  'school-rules/index': '/(tabs)/school-rules',
  settings: '/(tabs)/settings',
};

type TabListItem = (typeof TAB_DEFINITIONS)[number] & { visible: boolean };
type TabRowProps = {
  item: TabListItem;
  drag?: () => void;
  isActive?: boolean;
};

const AnimatedScreenView = View;
const NestableDraggableFlatList = null;
const SettingsScrollContainer = ScrollView;

interface SettingItemProps {
  icon: keyof typeof Icon.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
}

function SettingItem({ icon, title, subtitle, onPress, rightElement }: SettingItemProps) {
  const textColor = useThemeColor({}, 'text');
  const { actualColorScheme, accentColor } = useSettings();

  return (
    <DragSafeTouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={[styles.iconContainer, { backgroundColor: accentColors[accentColor] + '20' }]}>
        <Icon name={icon} size={IconSize.sm} color={accentColors[accentColor]} accessibilityElementsHidden={true} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="defaultSemiBold" style={[styles.settingTitle, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type="small" style={[styles.settingSubtitle, { color: Colors[actualColorScheme].icon }]} numberOfLines={2} ellipsizeMode="tail">
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightElement ? (
        <View style={styles.rightElementContainer}>
          {rightElement}
        </View>
      ) : (
        <Icon name="chevron-right" size={IconSize.sm} color={Colors[actualColorScheme].icon} accessibilityElementsHidden={true} />
      )}
    </DragSafeTouchableOpacity>
  );
}

interface ColorSelectorProps {
  selectedColor: AccentColor;
  onColorSelect: (color: AccentColor) => void;
}

function ColorSelector({ selectedColor, onColorSelect }: ColorSelectorProps) {
  return (
    <View style={styles.colorSelector} accessibilityRole="radiogroup" accessibilityLabel="アクセントカラー選択">
      {(Object.keys(accentColors) as AccentColor[]).map((color) => (
        <DragSafeTouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: accentColors[color] },
            selectedColor === color && styles.selectedColor,
          ]}
          onPress={() => onColorSelect(color)}
          accessible={true}
          accessibilityRole="radio"
          accessibilityLabel={`${color}色`}
          accessibilityState={{ selected: selectedColor === color }}
          accessibilityHint={selectedColor === color ? '現在選択中です' : 'タップして選択します'}
        >
          {selectedColor === color && (
            <Icon name="check" size={16} color="white" accessibilityElementsHidden={true} />
          )}
        </DragSafeTouchableOpacity>
      ))}
    </View>
  );
}

interface ThemeSelectorProps {
  selectedTheme: ColorScheme;
  onThemeSelect: (theme: ColorScheme) => void;
}

function ThemeSelector({ selectedTheme, onThemeSelect }: ThemeSelectorProps) {
  const { actualColorScheme, accentColor } = useSettings();
  const textColor = useThemeColor({}, 'text');

  const themes: { key: ColorScheme; label: string; icon: keyof typeof Icon.glyphMap }[] = [
    { key: 'light', label: 'ライト', icon: 'white-balance-sunny' },
    { key: 'dark', label: 'ダーク', icon: 'moon-waning-crescent' },
    { key: 'auto', label: 'システム設定', icon: 'theme-light-dark' },
  ];

  return (
    <View style={styles.themeSelector} accessibilityRole="radiogroup" accessibilityLabel="テーマ選択">
      {themes.map((theme) => (
        <DragSafeTouchableOpacity
          key={theme.key}
          style={[
            styles.themeOption,
            selectedTheme === theme.key && {
              backgroundColor: accentColors[accentColor] + '20',
              borderColor: accentColors[accentColor],
            },
          ]}
          onPress={() => onThemeSelect(theme.key)}
          accessible={true}
          accessibilityRole="radio"
          accessibilityLabel={theme.label}
          accessibilityState={{ selected: selectedTheme === theme.key }}
          accessibilityHint={selectedTheme === theme.key ? '現在選択中です' : 'タップして選択します'}
        >
          <Icon 
            name={theme.icon} 
            size={24} 
            color={selectedTheme === theme.key ? accentColors[accentColor] : Colors[actualColorScheme].icon}
            accessibilityElementsHidden={true}
          />
          <ThemedText 
            style={[
              styles.themeLabel,
              { color: selectedTheme === theme.key ? accentColors[accentColor] : textColor }
            ]}
          >
            {theme.label}
          </ThemedText>
        </DragSafeTouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const animatedStyle = useTabTransition();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const router = useRouter();
  const {
    colorScheme,
    accentColor,
    actualColorScheme,
    privacyPolicy,
    admissionYear,
    studentClass,
    gradeOffset,
    tabLayout,
    setColorScheme,
    setAccentColor,
    setPrivacyPolicy,
    setAdmissionYear,
    setStudentClass,
    setGradeOffset,
    setTabLayout,
    isLoading,
  } = useSettings();
  const { isInstallable, isIosManualInstall, promptInstall } = usePwaInstallPrompt();
  const reportFormUrl = 'https://forms.gle/p1AxsBk9WLz8HrWR6';
  const [cacheStatus, setCacheStatus] = React.useState<'idle' | 'clearing' | 'cleared' | 'empty' | 'error'>('idle');
  const [installing, setInstalling] = React.useState(false);
  const [lastClearedAt, setLastClearedAt] = React.useState<Date | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastAnim = React.useRef(new Animated.Value(0)).current;
  const toastIdRef = React.useRef(0);
  const [toastState, setToastState] = React.useState<{ message: string; variant: 'success' | 'info' | 'error'; id: number } | null>(null);

  const tabDefinitionById = React.useMemo(
    () => new Map(TAB_DEFINITIONS.map((tab) => [tab.id, tab])),
    [],
  );

  const tabItems = React.useMemo<TabListItem[]>(() => {
    return tabLayout
      .map((item) => {
        const definition = tabDefinitionById.get(item.id);
        if (!definition) {
          return null;
        }
        return { ...definition, visible: item.visible };
      })
      .filter(
        (item): item is (typeof TAB_DEFINITIONS)[number] & { visible: boolean } =>
          Boolean(item),
      );
  }, [tabLayout, tabDefinitionById]);

  const movableTabIds = React.useMemo(
    () => tabItems.filter((tab) => !tab.isPinned).map((tab) => tab.id),
    [tabItems],
  );

  const handleToggleTabVisibility = React.useCallback((id: TabId) => {
    const definition = tabDefinitionById.get(id);
    if (!definition || !definition.canHide) {
      return;
    }
    const nextLayout = tabLayout.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item,
    );
    setTabLayout(nextLayout);
  }, [tabDefinitionById, tabLayout, setTabLayout]);

  const handleMoveTab = React.useCallback((id: TabId, direction: -1 | 1) => {
    const definition = tabDefinitionById.get(id);
    if (!definition || definition.isPinned) {
      return;
    }

    const movable = tabLayout.filter((item) => !tabDefinitionById.get(item.id)?.isPinned);
    const pinned = tabLayout.filter((item) => tabDefinitionById.get(item.id)?.isPinned);
    const currentIndex = movable.findIndex((item) => item.id === id);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= movable.length) {
      return;
    }

    const nextMovable = [...movable];
    [nextMovable[currentIndex], nextMovable[nextIndex]] = [nextMovable[nextIndex], nextMovable[currentIndex]];
    setTabLayout([...nextMovable, ...pinned]);
  }, [tabDefinitionById, tabLayout, setTabLayout]);

  const handleNavigateToTab = React.useCallback((id: TabId) => {
    const path = TAB_ROUTES[id];
    if (path) {
      router.push(path);
    }
  }, [router]);

  const handleDragEnd = React.useCallback(({ data }: { data: TabListItem[] }) => {
    const nextLayout = data.map((item) => ({ id: item.id, visible: item.visible }));
    setTabLayout(nextLayout);
  }, [setTabLayout]);

  const renderTabRow = React.useCallback(({ item, drag, isActive = false }: TabRowProps) => {
    const movableIndex = movableTabIds.indexOf(item.id);
    const canMoveUp = movableIndex > 0;
    const canMoveDown = movableIndex > -1 && movableIndex < movableTabIds.length - 1;
    const accent = accentColors[accentColor];
    const iconColor = Colors[actualColorScheme].icon;
    const disabledIcon = Colors[actualColorScheme].border;
    const rowIndex = tabItems.findIndex((tab) => tab.id === item.id);
    const isPinned = !!item.isPinned;
    const canDrag = !!drag && !isPinned;

    return (
      <ThemedView
        style={[
          styles.tabRow,
          rowIndex > 0 && { borderTopWidth: 1, borderTopColor: Colors[actualColorScheme].border },
          !item.visible && styles.tabRowMuted,
          isActive && { backgroundColor: Colors[actualColorScheme].surfaceMuted },
        ]}
      >
        <View style={styles.tabRowLeft}>
          <Pressable
            style={[styles.tabDragHandle, isPinned && styles.tabDragHandleDisabled]}
            onPressIn={drag}
            disabled={!canDrag}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}を並び替え`}
            accessibilityHint={
              isPinned
                ? '固定されているため並び替えできません'
                : canDrag
                  ? '押したまま並び替えできます'
                  : '上下の移動ボタンで並び替えできます'
            }
          >
            <Icon
              name="drag-vertical"
              size={IconSize.xs}
              color={canDrag ? iconColor : disabledIcon}
              accessibilityElementsHidden={true}
            />
          </Pressable>
          <DragSafeTouchableOpacity
            style={styles.tabNameButton}
            onPress={() => handleNavigateToTab(item.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}を開く`}
            accessibilityHint="タブ画面に移動します"
          >
            <View style={[styles.tabIcon, { backgroundColor: accent + '20' }]}>
              <Icon name={item.icon} size={IconSize.sm} color={accent} accessibilityElementsHidden={true} />
            </View>
            <View style={styles.tabText}>
              <ThemedText type="defaultSemiBold" style={[styles.tabTitle, { color: textColor }]} numberOfLines={1}>
                {item.title}
              </ThemedText>
              {!item.canHide && (
                <ThemedText type="small" style={[styles.tabMeta, { color: Colors[actualColorScheme].icon }] }>
                  固定
                </ThemedText>
              )}
            </View>
          </DragSafeTouchableOpacity>
        </View>
        <View style={styles.tabRowRight}>
          <View style={styles.tabMoveGroup}>
            <DragSafeTouchableOpacity
              style={[
                styles.tabMoveButton,
                { backgroundColor: Colors[actualColorScheme].surfaceMuted },
                !canMoveUp && styles.tabMoveButtonDisabled,
              ]}
              onPress={() => handleMoveTab(item.id, -1)}
              disabled={!canMoveUp}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}を上へ移動`}
            >
              <Icon name="chevron-up" size={IconSize.sm} color={canMoveUp ? iconColor : disabledIcon} />
            </DragSafeTouchableOpacity>
            <DragSafeTouchableOpacity
              style={[
                styles.tabMoveButton,
                { backgroundColor: Colors[actualColorScheme].surfaceMuted },
                !canMoveDown && styles.tabMoveButtonDisabled,
              ]}
              onPress={() => handleMoveTab(item.id, 1)}
              disabled={!canMoveDown}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}を下へ移動`}
            >
              <Icon name="chevron-down" size={IconSize.sm} color={canMoveDown ? iconColor : disabledIcon} />
            </DragSafeTouchableOpacity>
          </View>
          {item.canHide ? (
            <Switch
              value={item.visible}
              onValueChange={() => handleToggleTabVisibility(item.id)}
              trackColor={{ false: Colors[actualColorScheme].icon + '40', true: accent + '80' }}
              thumbColor={item.visible ? accent : Colors[actualColorScheme].icon}
              accessibilityLabel={`${item.title}の表示`}
            />
          ) : (
            <View style={[styles.tabLockPill, { backgroundColor: Colors[actualColorScheme].surfaceMuted }]}>
              <Icon name="lock" size={14} color={Colors[actualColorScheme].icon} accessibilityElementsHidden={true} />
              <ThemedText type="small" style={[styles.tabLockText, { color: Colors[actualColorScheme].icon }]}>
                固定
              </ThemedText>
            </View>
          )}
        </View>
      </ThemedView>
    );
  }, [movableTabIds, accentColor, actualColorScheme, textColor, handleNavigateToTab, handleMoveTab, handleToggleTabVisibility, tabItems]);

  const supportsDragReorder = Platform.OS !== 'web' && !!NestableDraggableFlatList;

  const cacheSubtitle = React.useMemo(() => {
    switch (cacheStatus) {
      case 'clearing':
        return 'キャッシュを削除しています…';
      case 'cleared': {
        if (lastClearedAt) {
          const hours = String(lastClearedAt.getHours()).padStart(2, '0');
          const minutes = String(lastClearedAt.getMinutes()).padStart(2, '0');
          const seconds = String(lastClearedAt.getSeconds()).padStart(2, '0');
          return `キャッシュを削除しました（${hours}:${minutes}:${seconds}）`;
        }
        return 'キャッシュを削除しました';
      }
      case 'empty':
        return '削除できるキャッシュはありません';
      case 'error':
        return 'キャッシュの削除に失敗しました。時間を置いて再試行してください。';
      default:
        return '端末内に保存されている授業と給食データを削除します。データは必要に応じて自動で再取得されます。';
    }
  }, [cacheStatus, lastClearedAt]);

  const cacheStatusRightElement = React.useMemo(() => {
    if (cacheStatus === 'idle') return null;

    const chevron = (
      <Icon name="chevron-right" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
    );

    if (cacheStatus === 'clearing') {
      return (
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: accentColors[accentColor] + '20' }]}>
            <ActivityIndicator size="small" color={accentColors[accentColor]} />
            <ThemedText type="small" style={[styles.statusLabel, { color: accentColors[accentColor] }]}>
              削除中
            </ThemedText>
          </View>
          {chevron}
        </View>
      );
    }

    const statusMeta = (() => {
      switch (cacheStatus) {
        case 'cleared':
          return {
            icon: 'check-circle',
            color: Colors[actualColorScheme].success,
            bg: '#16A34A20',
            label: '完了',
          };
        case 'empty':
          return {
            icon: 'information-outline',
            color: Colors[actualColorScheme].icon,
            bg: Colors[actualColorScheme].surfaceMuted + '40',
            label: '未保存',
          };
        case 'error':
          return {
            icon: 'alert-circle-outline',
            color: Colors[actualColorScheme].error,
            bg: '#DC262620',
            label: '失敗',
          };
        default:
          return null;
      }
    })();

    if (!statusMeta) return chevron;

    return (
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <Icon name={statusMeta.icon as keyof typeof Icon.glyphMap} size={16} color={statusMeta.color} />
          <ThemedText type="small" style={[styles.statusLabel, { color: statusMeta.color }]}>
            {statusMeta.label}
          </ThemedText>
        </View>
        {chevron}
      </View>
    );
  }, [cacheStatus, accentColor, actualColorScheme]);

  const showToast = React.useCallback((message: string, variant: 'success' | 'info' | 'error' = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    toastAnim.stopAnimation();

    const nextId = toastIdRef.current + 1;
    toastIdRef.current = nextId;

    setToastState({ message, variant, id: nextId });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && toastIdRef.current === nextId) {
          setToastState(null);
        }
      });
      toastTimerRef.current = null;
    }, 2600);
  }, [toastAnim]);

  const clearCache = React.useCallback(async () => {
    setCacheStatus('clearing');

    try {
      const keys = await AsyncStorage.getAllKeys();
      const targetKeys = keys.filter((key) =>
        key.startsWith('cache_') || key.startsWith('wakosen-api-v1:')
      );

      if (targetKeys.length > 0) {
        await AsyncStorage.multiRemove(targetKeys);
        setCacheStatus('cleared');
        setLastClearedAt(new Date());
        showToast('キャッシュを削除しました', 'success');
      } else {
        setCacheStatus('empty');
        setLastClearedAt(null);
        showToast('削除できるキャッシュはありません', 'info');
      }
    } catch (error) {
      setCacheStatus('error');
      setLastClearedAt(null);
      console.error('Failed to clear cache', error);
      showToast('キャッシュの削除に失敗しました。時間を置いて再度お試しください。', 'error');
    }
  }, [showToast]);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      toastAnim.stopAnimation();
    };
  }, [toastAnim]);

  const getFiscalYear = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const fiscalYearStart = new Date(year, 3, 1);
    return now >= fiscalYearStart ? year : year - 1;
  }, []);

  const incrementAdmissionYear = () => {
    const fiscal = getFiscalYear;
    const current = admissionYear ?? fiscal;
    const next = Math.min(fiscal, current + 1);
    setAdmissionYear(next);
  };

  const decrementAdmissionYear = () => {
    const fiscal = getFiscalYear;
    const current = admissionYear ?? fiscal;
    const next = Math.max(fiscal - 4, current - 1);
    setAdmissionYear(next);
  };

  const incrementGradeOffset = () => {
    if (admissionYear === null) return;
    setGradeOffset(Math.min(3, (gradeOffset ?? 0) + 1));
  };

  const decrementGradeOffset = () => {
    if (admissionYear === null) return;
    setGradeOffset(Math.max(-3, (gradeOffset ?? 0) - 1));
  };

  const baseGrade = React.useMemo(() => {
    if (admissionYear === null) return null;
    const fiscal = getFiscalYear;
    return Math.max(1, Math.min(5, fiscal - admissionYear + 1));
  }, [admissionYear, getFiscalYear]);

  const adjustedGrade = React.useMemo(() => {
    if (baseGrade === null) return null;
    return Math.max(1, Math.min(5, baseGrade + (gradeOffset ?? 0)));
  }, [baseGrade, gradeOffset]);

  const cycleClass = (direction: 1 | -1) => {
    const list: StudentClass[] = ['A', 'B', 'C', 'D'];
    const idx = list.indexOf(studentClass);
    const nextIdx = (idx + direction + list.length) % list.length;
    setStudentClass(list[nextIdx]);
  };

  const handleOpenReportForm = React.useCallback(() => {
    if (!reportFormUrl) {
      return;
    }
    Linking.openURL(reportFormUrl).catch(() => {
      // ユーザー環境でURLを開けない場合は静かに無視
    });
  }, [reportFormUrl]);

  const handleClearCache = React.useCallback(() => {
    if (cacheStatus === 'clearing') {
      showToast('削除処理を実行中です…', 'info');
      return;
    }

    void clearCache();
  }, [cacheStatus, clearCache, showToast]);

  const handlePwaInstall = React.useCallback(async () => {
    if (!isInstallable || installing) {
      return;
    }
    setInstalling(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        showToast('インストールを開始しました', 'success');
      } else if (outcome === 'dismissed') {
        showToast('インストールをキャンセルしました', 'info');
      }
    } catch (error) {
      console.error('PWA install error:', error);
      showToast('インストールに失敗しました', 'error');
    } finally {
      setInstalling(false);
    }
  }, [isInstallable, installing, promptInstall, showToast]);

  const toastTranslateY = React.useMemo(() => toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  }), [toastAnim]);

  const toastColors = React.useMemo(() => ({
    success: { background: Colors[actualColorScheme].success, text: '#FFFFFF' },
    info: { background: Colors[actualColorScheme].surfaceMuted, text: Colors[actualColorScheme].text },
    error: { background: Colors[actualColorScheme].error, text: '#FFFFFF' },
  }), [actualColorScheme]);

  const toastPalette = toastState ? toastColors[toastState.variant] : null;

  // 設定読み込み中はスケルトンUIを表示
  if (isLoading) {
    return (
      <AnimatedScreenView style={[{ flex: 1 }, animatedStyle]}>
        <Stack.Screen options={{ title: '設定' }} />
        <SkeletonScreen />
      </AnimatedScreenView>
    );
  }

  return (
    <AnimatedScreenView style={[{ flex: 1 }, animatedStyle]}>
      <Stack.Screen options={{ title: '設定' }} />
      <SettingsScrollContainer
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      >
      {/* ヘッダー */}
      <ThemedView style={styles.header}>
        <Icon name="cog" size={IconSize.lg} color={Colors[actualColorScheme].accent} />
        <ThemedView style={styles.headerText}>
          <ThemedText type="title" style={styles.title}>設定</ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: Colors[actualColorScheme].icon, opacity: 0.7 }]}>
            アプリの外観と動作をカスタマイズ
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* 学年とクラス（最上部） */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>学年とクラス</ThemedText>
        <Card elevation="sm" style={styles.settingGroup} noPadding>
          <ThemedView style={styles.settingHeader}>
            <Icon name="calendar" size={IconSize.sm} color={Colors[actualColorScheme].accent} />
            <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: textColor }]}>入学年度</ThemedText>
          </ThemedView>
          <SettingItem
            icon="calendar"
            title="入学年度"
            subtitle="現在の学年に連動して表示されます"
            onPress={() => {}}
            rightElement={
              admissionYear === null ? (
                <ThemedText style={[styles.selectorValue, { color: Colors[actualColorScheme].icon }]}>
                  入学していません
                </ThemedText>
              ) : (
                <View style={styles.selectorRow}>
                  <DragSafeTouchableOpacity style={styles.miniBtn} onPress={decrementAdmissionYear}>
                    <Icon name="chevron-left" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                  </DragSafeTouchableOpacity>
                  <ThemedText style={[styles.selectorValue, { color: textColor }]}>
                    {admissionYear}
                  </ThemedText>
                  <DragSafeTouchableOpacity style={styles.miniBtn} onPress={incrementAdmissionYear}>
                    <Icon name="chevron-right" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                  </DragSafeTouchableOpacity>
                </View>
              )
            }
          />
          <ThemedView style={styles.notEnrolledButtonContainer}>
            <DragSafeTouchableOpacity
              style={[
                styles.notEnrolledButton,
                {
                  backgroundColor: admissionYear === null
                    ? accentColors[accentColor] + '20'
                    : 'transparent',
                  borderColor: admissionYear === null
                    ? accentColors[accentColor]
                    : Colors[actualColorScheme].border,
                },
              ]}
              onPress={() => {
                if (admissionYear === null) {
                  setAdmissionYear(getFiscalYear);
                  showToast('入学年度を設定しました', 'info');
                } else {
                  setAdmissionYear(null);
                  showToast('入学していない状態に設定しました', 'info');
                }
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="入学していません"
              accessibilityHint={admissionYear === null ? "入学年度を設定して、入学していない状態を解除します" : "入学年度をクリアして、入学していない状態に設定します"}
            >
              <Icon
                name={admissionYear === null ? "check-circle" : "school-outline"}
                size={IconSize.sm}
                color={admissionYear === null ? accentColors[accentColor] : Colors[actualColorScheme].icon}
              />
              <ThemedText
                style={[
                  styles.notEnrolledButtonText,
                  {
                    color: admissionYear === null
                      ? accentColors[accentColor]
                      : Colors[actualColorScheme].icon,
                  },
                ]}
              >
                入学していません
              </ThemedText>
            </DragSafeTouchableOpacity>
          </ThemedView>
        </Card>

        <Card elevation="sm" style={styles.settingGroup} noPadding>
          <ThemedView style={styles.settingHeader}>
            <Icon name="alphabetical-variant" size={IconSize.sm} color={Colors[actualColorScheme].accent} />
            <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: textColor }]}>クラス</ThemedText>
          </ThemedView>
          <SettingItem
            icon="alphabetical-variant"
            title="クラス"
            subtitle="A〜D を選択します"
            onPress={() => {}}
            rightElement={
              <View style={styles.selectorRow}>
                <DragSafeTouchableOpacity style={styles.miniBtn} onPress={() => cycleClass(-1)}>
                  <Icon name="chevron-left" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                </DragSafeTouchableOpacity>
                <ThemedText style={[styles.selectorValue, { color: textColor }]}>
                  {studentClass}
                </ThemedText>
                <DragSafeTouchableOpacity style={styles.miniBtn} onPress={() => cycleClass(1)}>
                  <Icon name="chevron-right" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                </DragSafeTouchableOpacity>
              </View>
            }
          />
        </Card>

        <Card elevation="sm" style={styles.settingGroup} noPadding>
          <ThemedView style={styles.settingHeader}>
            <Icon name="school-outline" size={IconSize.sm} color={Colors[actualColorScheme].accent} />
            <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: textColor }]}>学年の調整</ThemedText>
          </ThemedView>
          <SettingItem
            icon="school-outline"
            title="学年の調整"
            subtitle="自動計算が合わない場合は調整できます（編入・休学など）。"
            onPress={() => {}}
            rightElement={
              <View style={styles.selectorRow}>
                <DragSafeTouchableOpacity
                  style={styles.miniBtn}
                  onPress={decrementGradeOffset}
                  disabled={admissionYear === null || (gradeOffset ?? 0) <= -3}
                >
                  <Icon name="chevron-left" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                </DragSafeTouchableOpacity>
                <ThemedText style={[styles.selectorValue, { color: textColor }]}>
                  {(gradeOffset ?? 0) > 0 ? `+${gradeOffset}` : `${gradeOffset ?? 0}`}
                </ThemedText>
                <DragSafeTouchableOpacity
                  style={styles.miniBtn}
                  onPress={incrementGradeOffset}
                  disabled={admissionYear === null || (gradeOffset ?? 0) >= 3}
                >
                  <Icon name="chevron-right" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                </DragSafeTouchableOpacity>
              </View>
            }
          />
          {admissionYear === null ? (
            <ThemedText type="small" style={[styles.groupSubtitle, { color: Colors[actualColorScheme].icon }]}>
              入学年度が未設定のため調整は無効です
            </ThemedText>
          ) : (
            <ThemedText type="small" style={[styles.groupSubtitle, { color: Colors[actualColorScheme].icon }]}>
              自動計算: {baseGrade}年 → 調整: {(gradeOffset ?? 0) > 0 ? `+${gradeOffset}` : `${gradeOffset ?? 0}`} → 表示: {adjustedGrade}年
            </ThemedText>
          )}
        </Card>
      </ThemedView>

      

      {/* 外観設定 */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
          外観
        </ThemedText>

        {/* テーマ選択 */}
        <Card elevation="sm" style={styles.settingGroup}>
          <ThemedView style={styles.settingHeader}>
            <Icon name="palette" size={IconSize.sm} color={Colors[actualColorScheme].accent} />
            <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: textColor }]}>
              テーマ
            </ThemedText>
          </ThemedView>
          <ThemeSelector selectedTheme={colorScheme} onThemeSelect={setColorScheme} />
        </Card>

        {/* アクセントカラー選択 */}
        <Card elevation="sm" style={styles.settingGroup}>
          <ThemedView style={styles.settingHeader}>
            <Icon name="format-color-fill" size={IconSize.sm} color={Colors[actualColorScheme].accent} />
            <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: textColor }]}>
              アクセントカラー
            </ThemedText>
          </ThemedView>
          <ThemedText type="small" style={[styles.groupSubtitle, { color: Colors[actualColorScheme].icon }]}>
            現在: {accentColorNames[accentColor]}
          </ThemedText>
          <ColorSelector selectedColor={accentColor} onColorSelect={setAccentColor} />
        </Card>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
          下部バー
        </ThemedText>

        <Card elevation="sm" style={styles.settingGroup}>
          <ThemedView style={styles.settingHeader}>
            <Icon name="view-dashboard-outline" size={IconSize.sm} color={Colors[actualColorScheme].accent} />
            <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: textColor }]}>
              タブの並び替え
            </ThemedText>
          </ThemedView>
          <ThemedText type="small" style={[styles.groupSubtitle, { color: Colors[actualColorScheme].icon }]}>
            {supportsDragReorder
              ? '左のハンドルを押したまま並び替えできます（上下の矢印でも調整可能）'
              : '上下の矢印で順番を調整できます'}
          </ThemedText>
            <View style={styles.tabList}>
              {tabItems.map((item) => (
                <View key={item.id}>
                  {renderTabRow({ item })}
                </View>
              ))}
            </View>
        </Card>
      </ThemedView>

      

      {/* アプリ情報 */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
          アプリ情報
        </ThemedText>

        <Card elevation="sm" style={styles.settingGroup}>
          <SettingItem
            icon="history"
            title="変更履歴"
            subtitle="アプリの更新内容を確認できます"
            onPress={() => router.push('/changelog')}
          />
          <SettingItem
            icon="information"
            title="バージョン"
            subtitle={APP_VERSION}
            onPress={() => {}}
            rightElement={<ThemedText type="small" style={{ color: Colors[actualColorScheme].icon }}>{APP_VERSION}</ThemedText>}
          />
          {(isInstallable || isIosManualInstall) && (
            <SettingItem
              icon="download-circle"
              title="ホーム画面に追加"
              subtitle={
                isInstallable
                  ? 'インストールするとブラウザを開かずに利用できます'
                  : 'Safariの共有メニューから「ホーム画面に追加」を選択してください'
              }
              onPress={handlePwaInstall}
              rightElement={
                isInstallable ? (
                  installing ? (
                    <ActivityIndicator size="small" color={accentColors[accentColor]} />
                  ) : (
                    <Icon name="chevron-right" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                  )
                ) : (
                  <Icon name="chevron-right" size={IconSize.sm} color={Colors[actualColorScheme].icon} />
                )
              }
            />
          )}
          <SettingItem
            icon="alert-circle-outline"
            title="お問い合わせ・時間割の誤りを報告"
            subtitle="Googleフォームでお問い合わせや誤りの報告を行えます"
            onPress={handleOpenReportForm}
          />
          <SettingItem
            icon="trash-can-outline"
            title="キャッシュを削除"
            subtitle={cacheSubtitle}
            onPress={handleClearCache}
            rightElement={cacheStatusRightElement ?? undefined}
          />
          {/*
          <SettingItem
            icon="shield-lock"
            title="プライバシー設定"
            subtitle="行動情報の収集を許可しますか？"
            onPress={() => { setPrivacyPolicy(!privacyPolicy); }}
            rightElement={
              <Switch
                value={privacyPolicy}
                onValueChange={setPrivacyPolicy}
                trackColor={{ false: Colors[actualColorScheme].icon + '40', true: accentColors[accentColor] + '80' }}
                thumbColor={privacyPolicy ? accentColors[accentColor] : Colors[actualColorScheme].icon}
              />
            }
          />*/}
        </Card>
      </ThemedView>

      {/* フッター */}
      <ThemedView style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: Colors[actualColorScheme].icon }]}>
          設定はアプリ内に自動保存されます
        </ThemedText>
      </ThemedView>
      </SettingsScrollContainer>
      {toastState && toastPalette && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastTranslateY }],
              backgroundColor: toastPalette.background,
            },
          ]}
        >
          <ThemedText type="small" style={[styles.toastText, { color: toastPalette.text }]} numberOfLines={2}>
            {toastState.message}
          </ThemedText>
        </Animated.View>
      )}
    </AnimatedScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs / 2,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: Spacing.xs / 2,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs / 2,
  },
  settingGroup: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  groupTitle: {
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  groupSubtitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg + Spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  settingContent: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginRight: Spacing.sm,
    paddingTop: 2,
  },
  rightElementContainer: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.5,
    borderRadius: Radius.lg,
    gap: Spacing.xs / 1.5,
  },
  statusLabel: {
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.lg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: Spacing.xs / 4,
  },
  settingSubtitle: {
    lineHeight: 16,
  },
  tabList: {
    marginTop: Spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  tabRowMuted: {
    opacity: 0.5,
  },
  tabRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  tabDragHandle: {
    width: 24,
    paddingVertical: Spacing.xs / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
    opacity: 0.6,
  },
  tabDragHandleDisabled: {
    opacity: 0.3,
  },
  tabNameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  tabRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: Spacing.sm,
  },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  tabText: {
    flex: 1,
    minWidth: 0,
  },
  tabTitle: {
    fontSize: 16,
  },
  tabMeta: {
    marginTop: 2,
  },
  tabMoveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tabMoveButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  tabMoveButtonDisabled: {
    opacity: 0.4,
  },
  tabLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm - 2,
    paddingVertical: Spacing.xs - 2,
    borderRadius: Radius.lg,
    gap: Spacing.xs / 2,
  },
  tabLockText: {
    fontWeight: '600',
  },
  colorSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: Spacing.lg + Spacing.xs,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedColor: {
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  themeSelector: {
    gap: Spacing.sm,
    marginLeft: Spacing.lg + Spacing.xs,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeLabel: {
    fontSize: 16,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  miniBtn: {
    paddingHorizontal: Spacing.sm - 2,
    paddingVertical: Spacing.xs - 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'center',
  },
  notEnrolledButtonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  notEnrolledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  notEnrolledButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
