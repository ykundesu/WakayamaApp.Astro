import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Design';

/**
 * 画面全体を覆うスケルトンUIコンポーネント
 * 設定読み込み中に表示され、システムカラースキームに基づいて色を決定します
 */
export function SkeletonScreen() {
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
      {/* ヘッダースケルトン */}
      <View style={styles.header}>
        <View style={[styles.skeletonCircle, { backgroundColor: skeletonColor }]} />
        <View style={styles.headerText}>
          <View style={[styles.skeletonLine, { width: 180, height: 28, backgroundColor: skeletonColor, marginBottom: 8 }]} />
          <View style={[styles.skeletonLine, { width: 140, height: 16, backgroundColor: skeletonColor }]} />
        </View>
        <View style={[styles.skeletonCircle, { width: 40, height: 40, backgroundColor: skeletonColor }]} />
      </View>

      {/* カードスケルトン1 */}
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <View style={[styles.skeletonLine, { width: 120, height: 18, backgroundColor: skeletonColor, marginBottom: 12 }]} />
        <View style={[styles.skeletonLine, { width: '70%', height: 12, backgroundColor: skeletonColor, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '45%', height: 12, backgroundColor: skeletonColor }]} />
      </View>

      {/* カードスケルトン2 */}
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <View style={[styles.skeletonLine, { width: 120, height: 18, backgroundColor: skeletonColor, marginBottom: 12 }]} />
        <View style={[styles.skeletonLine, { width: '75%', height: 12, backgroundColor: skeletonColor, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 12, backgroundColor: skeletonColor }]} />
      </View>

      {/* リストアイテムスケルトン */}
      <View style={styles.listSection}>
        <View style={[styles.skeletonLine, { width: 100, height: 20, backgroundColor: skeletonColor, marginBottom: 16, marginLeft: Spacing.xs / 2 }]} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.listItem, { borderBottomColor: borderColor }]}>
            <View style={[styles.skeletonCircle, { width: 24, height: 24, backgroundColor: skeletonColor, marginRight: 12 }]} />
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonLine, { width: '60%', height: 16, backgroundColor: skeletonColor, marginBottom: 8 }]} />
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
  skeletonCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
  },
  skeletonLine: {
    borderRadius: Radius.sm,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  listSection: {
    marginTop: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
});



