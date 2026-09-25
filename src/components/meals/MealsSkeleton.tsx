import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme as useSystemColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Design';

/**
 * 寮食画面用のスケルトンUIコンポーネント
 * システムカラースキームに基づいて色を決定します
 */
export function MealsSkeleton() {
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  const colorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  
  const backgroundColor = Colors[colorScheme].background;
  const cardBackground = Colors[colorScheme].card;
  const borderColor = Colors[colorScheme].border;
  const skeletonColor = colorScheme === 'dark' 
    ? 'rgba(148, 163, 184, 0.15)' 
    : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* 日付セレクタースケルトン */}
      <View style={[styles.dateSelector, { backgroundColor: cardBackground, borderColor }]}>
        <View style={[styles.skeletonCircle, { width: 32, height: 32, backgroundColor: skeletonColor }]} />
        <View style={[styles.skeletonLine, { width: 120, height: 20, backgroundColor: skeletonColor }]} />
        <View style={[styles.skeletonCircle, { width: 32, height: 32, backgroundColor: skeletonColor }]} />
      </View>

      {/* 食事タイプボタンスケルトン */}
      <View style={styles.mealTypeContainer}>
        {[1, 2, 3].map((i) => (
          <View 
            key={i} 
            style={[
              styles.mealTypeButton, 
              { backgroundColor: cardBackground, borderColor }
            ]}
          >
            <View style={[styles.skeletonLine, { width: 60, height: 16, backgroundColor: skeletonColor }]} />
          </View>
        ))}
      </View>

      {/* リストアイテムスケルトン */}
      <View style={styles.listContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.listItem, { borderBottomColor: borderColor }]}>
            <View style={[styles.skeletonCircle, { width: 24, height: 24, backgroundColor: skeletonColor, marginRight: 12 }]} />
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonLine, { width: '70%', height: 18, backgroundColor: skeletonColor, marginBottom: 8 }]} />
              <View style={[styles.skeletonLine, { width: '50%', height: 12, backgroundColor: skeletonColor, marginBottom: 4 }]} />
              <View style={[styles.skeletonLine, { width: '40%', height: 12, backgroundColor: skeletonColor }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md + 2,
    borderWidth: 1,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md + 2,
    gap: Spacing.sm - 2,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: 0,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
  },
  skeletonCircle: {
    borderRadius: Radius.xl,
  },
  skeletonLine: {
    borderRadius: Radius.sm,
  },
});



