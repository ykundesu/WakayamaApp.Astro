import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabTransition } from '@/hooks/useTabTransition';
import { useDormitoryEvents } from '@/hooks/useDormitoryEvents';
import { useSettings } from '@/contexts/SettingsContext';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Icon from '@/components/ui/AppIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSize, Radius, Spacing } from '@/constants/Design';
import { getFiscalYear } from '@/utils/classesUtils';
import { formatEventDate, getGradeLabel, resolveEventDate, startOfDay } from '@/utils/eventsUtils';
import type { DormitoryEvent } from '@/types/dormitoryEvents';

type EventItem = DormitoryEvent & {
  resolvedDate: Date;
  isRelevant: boolean;
  isUrgent: boolean;
  isPast: boolean;
};

const OFFICIAL_EVENTS_URL = 'https://www.wakayama-nct.ac.jp/campuslife/dormitory/calendar/';
const NOT_FOUND_MESSAGE = '最新のデータが和歌山高専公式サイトにアップロードされていない可能性があります。';

function computeUserGrade(params: {
  admissionYear: number | null;
  grade: number;
  gradeOffset: number;
}): number {
  const fiscalYear = getFiscalYear();
  const effectiveAdmissionYear = params.admissionYear ?? (fiscalYear - params.grade + 1);
  const computedGradeBase = Math.max(1, Math.min(5, fiscalYear - effectiveAdmissionYear + 1));
  return Math.max(1, Math.min(5, computedGradeBase + params.gradeOffset));
}

export default function EventsScreen() {
  const animatedStyle = useTabTransition();
  const { events, loading, error, errorStatus, academicYear, refetch } = useDormitoryEvents();
  const { grade, admissionYear, gradeOffset } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<EventItem>>(null);
  const hasAutoScrolled = useRef(false);
  const isFocused = useIsFocused();

  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const accentColorValue = useThemeColor({}, 'accent');
  const dangerColor = Colors[colorScheme].error;

  const userGrade = useMemo(
    () => computeUserGrade({
      admissionYear,
      grade,
      gradeOffset,
    }),
    [admissionYear, grade, gradeOffset],
  );

  const today = startOfDay(new Date());

  const eventItems = useMemo<EventItem[]>(() => {
    return events
      .map((event) => {
        const resolvedDate = resolveEventDate(academicYear, event.date);
        if (!resolvedDate) return null;
        const isRelevant = event.grade === null || event.grade === userGrade;
        const diffDays = Math.round((startOfDay(resolvedDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...event,
          resolvedDate,
          isRelevant,
          isUrgent: diffDays >= 0 && diffDays <= 7,
          isPast: diffDays < 0,
        };
      })
      .filter((item): item is EventItem => item !== null)
      .sort((a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime());
  }, [events, academicYear, today, userGrade]);

  const nextEventIndex = useMemo(() => {
    if (eventItems.length === 0) return -1;
    const todayTime = today.getTime();
    return eventItems.findIndex((item) => startOfDay(item.resolvedDate).getTime() > todayTime);
  }, [eventItems, today]);

  const urgentCount = eventItems.filter(item => item.isUrgent && item.isRelevant).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const openOfficialEvents = useCallback(() => {
    Linking.openURL(OFFICIAL_EVENTS_URL);
  }, []);

  const handleScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    const offset = info.averageItemLength * info.index;
    listRef.current?.scrollToOffset({ offset, animated: false });
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: false });
    }, 50);
  }, []);

  useEffect(() => {
    if (!isFocused) {
      hasAutoScrolled.current = false;
      return;
    }
    if (hasAutoScrolled.current || nextEventIndex < 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: nextEventIndex, animated: false });
    });

    hasAutoScrolled.current = true;
    return () => cancelAnimationFrame(frame);
  }, [isFocused, nextEventIndex]);

  if (loading && events.length === 0) {
    return (
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <Stack.Screen options={{ title: '行事' }} />
        <ThemedView style={[styles.centered, { backgroundColor }]}>
          <Icon name="progress-clock" size={40} color={accentColorValue} style={{ marginBottom: 12 }} />
          <ThemedText style={[styles.statusText, { color: textColor }]}>行事データを読み込み中...</ThemedText>
        </ThemedView>
      </Animated.View>
    );
  }

  if (error && events.length === 0) {
    const isNotFound = errorStatus === 404;

    return (
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <Stack.Screen options={{ title: '行事' }} />
        <ThemedView style={[styles.centered, { backgroundColor }]}>
          <Icon name="alert-circle-outline" size={40} color={dangerColor} style={{ marginBottom: 12 }} />
          <ThemedText style={[styles.statusText, { color: textColor }]}>
            エラー: {error}
          </ThemedText>
          {isNotFound && (
            <>
              <ThemedText style={[styles.notFoundHelpText, { color: textColor }]}>
                {NOT_FOUND_MESSAGE}
              </ThemedText>
              <Pressable
                style={({ pressed }) => [
                  styles.officialLinkButton,
                  { backgroundColor: accentColorValue, opacity: pressed ? 0.82 : 1 },
                ]}
                onPress={openOfficialEvents}
                accessibilityRole="link"
                accessibilityLabel="和歌山高専公式サイト 行事予定を開く"
              >
                <Icon name="open-in-new" size={IconSize.xs} color="#fff" style={{ marginRight: 6 }} />
                <ThemedText style={styles.officialLinkButtonText}>
                  和歌山高専公式サイト 行事予定を開く
                </ThemedText>
              </Pressable>
            </>
          )}
        </ThemedView>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Stack.Screen options={{ title: '行事' }} />
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <FlatList
          ref={listRef}
          data={eventItems}
          keyExtractor={(item, index) => `${item.date}-${item.name}-${item.grade ?? 'all'}-${index}`}
          contentContainerStyle={{
            paddingHorizontal: Spacing.md,
            paddingBottom: tabBarHeight + insets.bottom + Spacing.lg,
            paddingTop: Spacing.md,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          ListHeaderComponent={
            <Card elevation="sm" style={[styles.summaryCard, { backgroundColor: cardBackground }]}> 
              <View style={styles.summaryHeader}>
                <View style={[styles.summaryIcon, { backgroundColor: `${accentColorValue}18` }]}>
                  <Icon name="calendar-star" size={IconSize.md} color={accentColorValue} />
                </View>
                <View style={styles.summaryTextWrap}>
                  <ThemedText type="subtitle" style={styles.summaryTitle}>行事一覧</ThemedText>
                  <ThemedText style={[styles.summarySubtitle, { color: Colors[colorScheme].icon }]}> 
                    {academicYear}年度の行事 {eventItems.length}件
                  </ThemedText>
                </View>
              </View>
              <View style={styles.summaryBadges}>
                <View style={[styles.badge, { borderColor: `${accentColorValue}40`, backgroundColor: `${accentColorValue}12` }]}> 
                  <Icon name="account-group" size={IconSize.xs} color={accentColorValue} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.badgeText, { color: accentColorValue }]}>対象: {userGrade}年</ThemedText>
                </View>
                {urgentCount > 0 && (
                  <View style={[styles.badge, { borderColor: `${dangerColor}55`, backgroundColor: `${dangerColor}16` }]}> 
                    <Icon name="alert" size={IconSize.xs} color={dangerColor} style={{ marginRight: 4 }} />
                    <ThemedText style={[styles.badgeText, { color: dangerColor }]}>1週間以内 {urgentCount}件</ThemedText>
                  </View>
                )}
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <Card
              elevation="sm"
              style={[
                styles.eventCard,
                {
                  backgroundColor: cardBackground,
                  borderColor: item.isUrgent ? `${dangerColor}55` : Colors[colorScheme].border,
                },
              ]}
            >
              <View style={styles.eventRow}>
                <View
                  style={[
                    styles.dateBadge,
                    {
                      backgroundColor: item.isUrgent ? `${dangerColor}16` : `${accentColorValue}12`,
                      borderColor: item.isUrgent ? `${dangerColor}55` : `${accentColorValue}35`,
                    },
                  ]}
                >
                  <ThemedText style={[styles.dateText, { color: item.isUrgent ? dangerColor : accentColorValue }]}>
                    {formatEventDate(item.resolvedDate)}
                  </ThemedText>
                  {item.isUrgent && (
                    <View style={[styles.urgentPill, { backgroundColor: dangerColor }]}>
                      <ThemedText style={styles.urgentPillText}>1週間以内</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.eventBody}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={[
                      styles.eventTitle,
                      { color: textColor, opacity: item.isPast ? 0.65 : 1 },
                    ]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </ThemedText>
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.metaBadge,
                        {
                          borderColor: item.isRelevant ? `${accentColorValue}45` : Colors[colorScheme].border,
                          backgroundColor: item.isRelevant ? `${accentColorValue}12` : 'transparent',
                        },
                      ]}
                    >
                      <Icon
                        name="account-group"
                        size={IconSize.xs}
                        color={item.isRelevant ? accentColorValue : Colors[colorScheme].icon}
                        style={{ marginRight: 4 }}
                      />
                      <ThemedText
                        style={[
                          styles.metaText,
                          { color: item.isRelevant ? accentColorValue : textColor },
                        ]}
                      >
                        {getGradeLabel(item.grade)}
                      </ThemedText>
                    </View>
                    {item.isPast && (
                      <View style={[styles.metaBadge, { borderColor: Colors[colorScheme].border }]}>
                        <Icon name="check-circle" size={IconSize.xs} color={Colors[colorScheme].icon} style={{ marginRight: 4 }} />
                        <ThemedText style={[styles.metaText, { color: Colors[colorScheme].icon }]}>終了</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="calendar-blank" size={48} color={Colors[colorScheme].icon} style={{ marginBottom: 12 }} />
              <ThemedText style={[styles.statusText, { color: textColor }]}>行事情報がありません</ThemedText>
            </View>
          }
        />
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
  },
  notFoundHelpText: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: 'center',
  },
  officialLinkButton: {
    marginTop: Spacing.md,
    minHeight: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialLinkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
  },
  summarySubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  summaryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  eventCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateBadge: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 120,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  urgentPill: {
    marginTop: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radius.md,
  },
  urgentPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  eventBody: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  eventTitle: {
    fontSize: 16,
    marginBottom: Spacing.xs / 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
});
