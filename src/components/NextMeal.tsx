import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import Icon from '@/components/ui/AppIcon';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { DashboardMeal } from '@/types/home';

type NextMealProps = {
  nextMeal: DashboardMeal;
  loading: boolean;
  error: string | null;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
};

// メニュー名に合わせたアイコンマップ
const iconMap: Record<string, keyof typeof Icon.glyphMap> = {
  'ライス': 'rice',
  'パン': 'bread-slice',
  'カレー': 'bowl-mix',
};

function getIconName(main: string, subs: string[]): keyof typeof Icon.glyphMap {
  if (!main || typeof main !== 'string') {
    return 'food';
  }

  for (const key in iconMap) {
    if (main.includes(key)) return iconMap[key];
  }

  if (subs && Array.isArray(subs)) {
    if (subs.some((sub) => sub && sub.includes('ライス'))) {
      return 'rice';
    }
    if (subs.some((sub) => sub && sub.includes('パン'))) {
      return 'bread-slice';
    }
  }

  return 'food';
}

const mealTypeColors = {
  breakfast: {
    active: '#FF8A65',
    activeDark: '#E67A55',
    secondary: '#FFF3E0',
    secondaryDark: 'rgba(255, 138, 101, 0.18)',
    name: '朝食',
  },
  lunch: {
    active: '#4CAF50',
    activeDark: '#45A049',
    secondary: '#E8F5E9',
    secondaryDark: 'rgba(76, 175, 80, 0.18)',
    name: '昼食',
  },
  dinner: {
    active: '#00BCD4',
    activeDark: '#00A8C0',
    secondary: '#E0F2F1',
    secondaryDark: 'rgba(0, 188, 212, 0.18)',
    name: '夕食',
  },
} as const;

function formatDisplayDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今日';
  }
  if (diffDays === 1) {
    return '明日';
  }

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const weekday = weekdays[targetDate.getDay()];
  return `${month}/${day}(${weekday})`;
}

export function NextMeal({
  nextMeal,
  loading,
  error,
  onRefresh,
  refreshing = false,
}: NextMealProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: Colors.light.border, dark: Colors.dark.border }, 'text');
  const accentColorValue = useThemeColor({}, 'accent');

  const navigateToMeals = () => {
    router.push('/(tabs)/meals');
  };

  if (loading && !nextMeal) {
    return (
      <DragSafeTouchableOpacity
        style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
        onPress={navigateToMeals}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="次の寮食"
        accessibilityHint="読み込み中です"
      >
        <View style={styles.header}>
          <Icon name="food" size={24} color={accentColorValue} accessibilityElementsHidden={true} />
          <ThemedText type="subtitle" style={styles.title}>次の寮食</ThemedText>
        </View>
        <View style={styles.centered}>
          <Icon name="progress-clock" size={32} color={accentColorValue} accessibilityElementsHidden={true} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>読み込み中...</ThemedText>
        </View>
      </DragSafeTouchableOpacity>
    );
  }

  if (error) {
    return (
      <DragSafeTouchableOpacity
        style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
        onPress={navigateToMeals}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="次の寮食"
        accessibilityHint="エラーが発生しています。タップして詳細を確認"
      >
        <View style={styles.header}>
          <Icon name="food" size={24} color={Colors[colorScheme].accent} accessibilityElementsHidden={true} />
          <ThemedText type="subtitle" style={styles.title}>次の寮食</ThemedText>
        </View>
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={32} color="#FF6B6B" accessibilityElementsHidden={true} />
          <ThemedText style={[styles.errorText, { color: textColor }]}>エラーが発生しました</ThemedText>
          {onRefresh && (
            <DragSafeTouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: accentColorValue, opacity: refreshing ? 0.7 : 1 },
              ]}
              onPress={onRefresh}
              disabled={refreshing}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="再読み込み"
            >
              <ThemedText style={styles.refreshButtonText}>
                {refreshing ? '更新中…' : '再読み込み'}
              </ThemedText>
            </DragSafeTouchableOpacity>
          )}
        </View>
      </DragSafeTouchableOpacity>
    );
  }

  if (!nextMeal || nextMeal.meal.length === 0) {
    return (
      <DragSafeTouchableOpacity
        style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
        onPress={navigateToMeals}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="次の寮食"
        accessibilityHint="メニュー情報がまだ利用できません"
      >
        <View style={styles.header}>
          <Icon name="food" size={24} color={Colors[colorScheme].accent} accessibilityElementsHidden={true} />
          <ThemedText type="subtitle" style={styles.title}>次の寮食</ThemedText>
        </View>
        <View style={styles.centered}>
          <Icon name="food-off" size={32} color={Colors[colorScheme].icon} accessibilityElementsHidden={true} />
          <ThemedText style={[styles.noMealText, { color: textColor }]}>メニュー情報がありません</ThemedText>
          {onRefresh && (
            <DragSafeTouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: accentColorValue, opacity: refreshing ? 0.7 : 1 },
              ]}
              onPress={onRefresh}
              disabled={refreshing}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="再読み込み"
              accessibilityHint="メニュー情報を再度取得します"
            >
              <ThemedText style={styles.refreshButtonText}>
                {refreshing ? '更新中…' : '再読み込み'}
              </ThemedText>
            </DragSafeTouchableOpacity>
          )}
        </View>
      </DragSafeTouchableOpacity>
    );
  }

  const { meal, type, date } = nextMeal;
  const mealInfo = mealTypeColors[type];

  return (
    <DragSafeTouchableOpacity
      style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
      onPress={navigateToMeals}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="次の寮食"
      accessibilityHint="メニュー詳細を確認します。タップして移動"
    >
      <View style={styles.header}>
        <Icon name="food" size={24} color={accentColorValue} accessibilityElementsHidden={true} />
        <ThemedText type="subtitle" style={styles.title}>次の寮食</ThemedText>
        <Icon name="chevron-right" size={20} color={Colors[colorScheme].icon} accessibilityElementsHidden={true} />
      </View>

      <View style={styles.mealInfo}>
        <View
          style={[
            styles.mealTypeBadge,
            {
              backgroundColor: colorScheme === 'dark'
                ? mealInfo.activeDark
                : mealInfo.active,
            },
          ]}
        >
          <ThemedText style={styles.mealTypeText}>
            {formatDisplayDate(date)}の{mealInfo.name}
          </ThemedText>
        </View>

        <View style={styles.menuList}>
          {meal.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.menuItem}>
              <Icon
                name={getIconName(item.mainType, item.subs)}
                size={18}
                color={mealInfo.active}
                style={styles.menuIcon}
              />
              <View style={styles.menuDetails}>
                <ThemedText type="defaultSemiBold" style={[styles.menuMain, { color: textColor }]}>
                  {item.main}
                </ThemedText>
                {item.subs.length > 0 && (
                  <ThemedText style={[styles.menuSubs, { color: Colors[colorScheme].icon }]} numberOfLines={1}>
                    {item.subs.slice(0, 2).join(', ')}
                    {item.subs.length > 2 ? ' など' : ''}
                  </ThemedText>
                )}
              </View>
            </View>
          ))}

          {meal.length > 3 && (
            <View style={styles.moreItems}>
              <ThemedText style={[styles.moreText, { color: Colors[colorScheme].icon }]}>
                他 {meal.length - 3} 品
              </ThemedText>
            </View>
          )}
        </View>

        {meal[0]?.nutrition && (
          <View
            style={[
              styles.nutritionInfo,
              {
                backgroundColor: colorScheme === 'dark'
                  ? mealInfo.secondaryDark
                  : mealInfo.secondary,
              },
            ]}
          >
            <ThemedText style={[styles.nutritionText, { color: mealInfo.active }]}>
              エネルギー: {meal[0].nutrition.energyKcal ?? '-'} kcal
            </ThemedText>
          </View>
        )}
      </View>
    </DragSafeTouchableOpacity>
  );
}

export default NextMeal;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    marginLeft: 8,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  noMealText: {
    marginTop: 8,
    fontSize: 14,
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  mealInfo: {
    gap: 12,
  },
  mealTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mealTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  menuIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  menuDetails: {
    flex: 1,
  },
  menuMain: {
    fontSize: 15,
    lineHeight: 20,
  },
  menuSubs: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  moreItems: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  nutritionInfo: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  nutritionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
