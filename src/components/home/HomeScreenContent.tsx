import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import {
  Animated as RNAnimated,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NextMeal } from '@/components/NextMeal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TodayClasses } from '@/components/TodayClasses';
import { UpcomingEvents } from '@/components/UpcomingEvents';
import { Card } from '@/components/ui/Card';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import Icon from '@/components/ui/AppIcon';
import { Colors } from '@/constants/Colors';
import { IconSize, Radius, Spacing } from '@/constants/Design';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

const PWAInstallBannerLazy = React.lazy(() => import('@/components/PWAInstallBanner').then(module => ({default: module.PWAInstallBanner})));

export function HomeScreenContent() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColorValue = useThemeColor({}, 'accent');
  const insets = useSafeAreaInsets();
  const spinValue = useRef(new RNAnimated.Value(0)).current;
  const [isRefreshingIconSpinning, setIsRefreshingIconSpinning] = useState(false);

  const {
    todayClasses,
    classesLoading,
    classesError,
    nextMeal,
    mealsLoading,
    mealsError,
    events,
    eventsLoading,
    eventsError,
    academicYear,
    refreshing,
    refresh,
  } = useHomeDashboardData();

  useEffect(() => {
    if (!refreshing) {
      setIsRefreshingIconSpinning(false);
      spinValue.stopAnimation();
      spinValue.setValue(0);
      return;
    }

    setIsRefreshingIconSpinning(true);
    const spinAnimation = RNAnimated.loop(
      RNAnimated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    );
    spinAnimation.start();

    return () => {
      spinAnimation.stop();
      spinValue.setValue(0);
      setIsRefreshingIconSpinning(false);
    };
  }, [refreshing, spinValue]);

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'おつかれさまでした';
    if (hour < 10) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  return (
    <>
      <Stack.Screen options={{ title: 'ホーム' }} />
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      >
        <ThemedView style={styles.header} accessibilityRole="header">
          <Icon
            name="home"
            size={IconSize.lg}
            color={accentColorValue}
            accessibilityElementsHidden={true}
          />
          <ThemedView style={styles.headerText}>
            <ThemedText type="title" style={styles.greeting}>
              {getCurrentGreeting()}！
            </ThemedText>
            <ThemedText type="small" style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
              今日も一日頑張りましょう
            </ThemedText>
          </ThemedView>
          <DragSafeTouchableOpacity
            style={[
              styles.refreshButton,
              {
                borderColor: accentColorValue + '30',
                backgroundColor: accentColorValue + '15',
              },
            ]}
            onPress={refresh}
            disabled={refreshing}
            accessible={true}
            accessibilityLabel="データ更新"
            accessibilityRole="button"
            accessibilityHint={refreshing ? '更新中です' : '授業と給食と行事データを更新します'}
            accessibilityState={{ disabled: refreshing }}
          >
            <RNAnimated.View
              style={{
                transform: [
                  {
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Icon
                name="refresh"
                size={IconSize.sm}
                color={accentColorValue}
                accessibilityElementsHidden={true}
              />
            </RNAnimated.View>
          </DragSafeTouchableOpacity>
        </ThemedView>

        <Suspense fallback={null}>
          <PWAInstallBannerLazy />
        </Suspense>

        <ThemedView style={styles.dashboard}>
          <TodayClasses
            classes={todayClasses}
            loading={classesLoading}
            error={classesError}
          />
          <NextMeal
            nextMeal={nextMeal}
            loading={mealsLoading}
            error={mealsError}
            onRefresh={refresh}
            refreshing={isRefreshingIconSpinning}
          />
          <UpcomingEvents
            events={events}
            loading={eventsLoading}
            error={eventsError}
            academicYear={academicYear}
            onRefresh={refresh}
            refreshing={isRefreshingIconSpinning}
          />
        </ThemedView>

        <ThemedView style={styles.featuresSection} accessibilityRole="list">
          <ThemedText type="subtitle" style={styles.sectionTitle} accessibilityRole="header">
            アプリの機能
          </ThemedText>

          <DragSafeTouchableOpacity
            onPress={() => router.push('/(tabs)/classes')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="授業スケジュール"
            accessibilityHint="今日の授業や週間スケジュールを確認できます。タップして詳細を表示します"
          >
            <Card style={styles.featureCard} elevation="sm">
              <Icon name="school" size={IconSize.md} color={accentColorValue} accessibilityElementsHidden={true} />
              <ThemedView style={styles.featureText}>
                <ThemedText type="defaultSemiBold" style={styles.featureTitle}>授業スケジュール</ThemedText>
                <ThemedText type="small" style={[styles.featureDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  今日の授業や週間スケジュールを確認できます
                </ThemedText>
              </ThemedView>
            </Card>
          </DragSafeTouchableOpacity>

          <DragSafeTouchableOpacity
            onPress={() => router.push('/(tabs)/meals')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="寮食メニュー"
            accessibilityHint="学生寮の朝食・昼食・夕食メニューを確認できます。タップして詳細を表示します"
          >
            <Card style={styles.featureCard} elevation="sm">
              <Icon name="food" size={IconSize.md} color={accentColorValue} accessibilityElementsHidden={true} />
              <ThemedView style={styles.featureText}>
                <ThemedText type="defaultSemiBold" style={styles.featureTitle}>寮食メニュー</ThemedText>
                <ThemedText type="small" style={[styles.featureDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  学生寮の朝食・昼食・夕食メニューを確認できます
                </ThemedText>
              </ThemedView>
            </Card>
          </DragSafeTouchableOpacity>

          <DragSafeTouchableOpacity
            onPress={() => router.push('/(tabs)/events')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="行事"
            accessibilityHint="寮の行事予定を確認できます。タップして詳細を表示します"
          >
            <Card style={styles.featureCard} elevation="sm">
              <Icon name="calendar-star" size={IconSize.md} color={accentColorValue} accessibilityElementsHidden={true} />
              <ThemedView style={styles.featureText}>
                <ThemedText type="defaultSemiBold" style={styles.featureTitle}>行事</ThemedText>
                <ThemedText type="small" style={[styles.featureDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  寮の行事予定をまとめて確認できます
                </ThemedText>
              </ThemedView>
            </Card>
          </DragSafeTouchableOpacity>
        </ThemedView>
      </ScrollView>
    </>
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
  greeting: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: Spacing.xs / 2,
  },
  dashboard: {
    marginBottom: Spacing.xl,
  },
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs / 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  featureTitle: {
    fontSize: 16,
    marginBottom: Spacing.xs / 2,
  },
  featureDescription: {
    lineHeight: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
