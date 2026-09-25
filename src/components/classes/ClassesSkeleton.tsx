import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme as useSystemColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Design';

/**
 * 授業時間割画面用のスケルトンUIコンポーネント
 * システムカラースキームに基づいて色を決定します
 */
export function ClassesSkeleton() {
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
      {/* 日付カードスケルトン */}
      <View style={[styles.dateCard, { backgroundColor: cardBackground, borderColor }]}>
        <View style={[styles.skeletonCircle, { width: 32, height: 32, backgroundColor: skeletonColor }]} />
        <View style={styles.dateTextContainer}>
          <View style={[styles.skeletonLine, { width: 80, height: 14, backgroundColor: skeletonColor, marginBottom: 8 }]} />
          <View style={[styles.skeletonLine, { width: 150, height: 24, backgroundColor: skeletonColor }]} />
        </View>
        <View style={[styles.skeletonCircle, { width: 32, height: 32, backgroundColor: skeletonColor }]} />
      </View>

      {/* 授業リストアイテムスケルトン */}
      <View style={styles.listContainer}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[styles.listItem, { backgroundColor: cardBackground, borderColor }]}>
            <View style={[styles.timeColumn, { borderRightColor: borderColor }]}>
              <View style={[styles.skeletonLine, { width: 50, height: 16, backgroundColor: skeletonColor, marginBottom: 4 }]} />
              <View style={[styles.skeletonLine, { width: 50, height: 16, backgroundColor: skeletonColor }]} />
            </View>
            <View style={styles.contentColumn}>
              <View style={[styles.skeletonLine, { width: '70%', height: 18, backgroundColor: skeletonColor, marginBottom: 8 }]} />
              <View style={[styles.skeletonLine, { width: '50%', height: 14, backgroundColor: skeletonColor, marginBottom: 4 }]} />
              <View style={[styles.skeletonLine, { width: '60%', height: 14, backgroundColor: skeletonColor }]} />
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
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs / 2,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  timeColumn: {
    width: 80,
    paddingRight: Spacing.sm,
    borderRightWidth: 1,
    marginRight: Spacing.sm,
  },
  contentColumn: {
    flex: 1,
  },
  skeletonCircle: {
    borderRadius: Radius.xl,
  },
  skeletonLine: {
    borderRadius: Radius.sm,
  },
});



