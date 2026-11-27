import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import Icon from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ThemedText';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { useSettings } from '@/contexts/SettingsContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Design';
import { getFiscalYear } from '@/utils/classesUtils';
import { getGradeLabel, resolveEventDate, startOfDay } from '@/utils/eventsUtils';
import type { DormitoryEvent } from '@/types/dormitoryEvents';

type UpcomingEventsProps = {
  events: DormitoryEvent[];
  loading: boolean;
  error: string | null;
  academicYear: number;
  refreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
};

type ResolvedEvent = DormitoryEvent & {
  resolvedDate: Date;
};

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

export function UpcomingEvents({
  events,
  loading,
  error,
  academicYear,
  refreshing = false,
  onRefresh,
}: UpcomingEventsProps) {
  const { grade, admissionYear, gradeOffset } = useSettings();
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: Colors.light.border, dark: Colors.dark.border }, 'text');
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

  const upcomingEvents = useMemo(() => {
    return events
      .map((event) => {
        const resolved = resolveEventDate(academicYear, event.date);
        if (!resolved) return null;
        return { ...event, resolvedDate: resolved };
      })
      .filter((event): event is ResolvedEvent => event !== null)
      .filter((event) => {
        const isRelevant = event.grade === null || event.grade === userGrade;
        return isRelevant && startOfDay(event.resolvedDate).getTime() >= today.getTime();
      })
      .sort((a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime());
  }, [events, academicYear, today, userGrade]);

  const nextEvent = upcomingEvents[0] ?? null;
  const daysUntilEvent = nextEvent
    ? Math.round((nextEvent.resolvedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  const isSoon = daysUntilEvent <= 5;
  const eventColor = isSoon ? (colorScheme === 'dark' ? '#FCA5A5' : '#991B1B') : textColor;
  const eventAccent = isSoon ? eventColor : accentColorValue;
  const eventMuted = isSoon ? eventColor : Colors[colorScheme].icon;
  const urgentBackground = colorScheme === 'dark' ? '#451A24' : '#FEF2F2';

  const showLoading = loading && events.length === 0;
  const showError = Boolean(error) && events.length === 0;

  const navigateToEvents = () => {
    router.push('/(tabs)/events');
  };

  return (
    <DragSafeTouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSoon ? urgentBackground : cardBackground,
          borderColor: isSoon ? dangerColor : borderColor,
        },
      ]}
      onPress={navigateToEvents}
      activeOpacity={0.92}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="行事"
      accessibilityHint="行事一覧を確認します。タップして移動"
    >
      <View style={styles.header}>
        <Icon
          name="calendar-star"
          size={24}
          color={eventAccent}
          accessibilityElementsHidden={true}
        />
        <ThemedText type="subtitle" style={[styles.title, { color: eventColor }]}>行事</ThemedText>
        <Icon name="chevron-right" size={20} color={eventMuted} accessibilityElementsHidden={true} />
      </View>

      {showLoading && (
        <View style={styles.centered}>
          <Icon name="progress-clock" size={32} color={accentColorValue} />
          <ThemedText style={[styles.statusText, { color: textColor }]}>読み込み中...</ThemedText>
        </View>
      )}

      {showError && (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={32} color={dangerColor} />
          <ThemedText style={[styles.statusText, { color: textColor }]}>行事データの取得に失敗しました</ThemedText>
          {onRefresh && (
            <DragSafeTouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: accentColorValue, opacity: refreshing ? 0.7 : 1 },
              ]}
              onPress={onRefresh}
              disabled={refreshing}
              accessibilityRole="button"
              accessibilityLabel="行事を再読み込み"
            >
              <ThemedText style={styles.retryButtonText}>
                {refreshing ? '更新中…' : '再読み込み'}
              </ThemedText>
            </DragSafeTouchableOpacity>
          )}
        </View>
      )}

      {!showLoading && !showError && !nextEvent && (
        <View style={styles.centered}>
          <Icon name="calendar-check" size={32} color={Colors[colorScheme].icon} />
          <ThemedText style={[styles.statusText, { color: textColor }]}>直近の行事はありません</ThemedText>
        </View>
      )}

      {!showLoading && !showError && nextEvent && (
        <View style={styles.eventRow}>
          <View style={styles.dateColumn}>
            <ThemedText type="caption" style={{ color: eventMuted }}>
              {nextEvent.resolvedDate.getMonth() + 1}月
            </ThemedText>
            <ThemedText style={[styles.dateText, { color: eventAccent }]}>
              {nextEvent.resolvedDate.getDate()}
            </ThemedText>
            <ThemedText type="caption" style={{ color: eventMuted }}>
              {['日', '月', '火', '水', '木', '金', '土'][nextEvent.resolvedDate.getDay()]}曜日
            </ThemedText>
          </View>
          <View style={styles.eventDetails}>
            <ThemedText type="caption" style={[styles.relativeDate, { color: eventAccent }]}>
              {daysUntilEvent === 0 ? '今日' : daysUntilEvent === 1 ? '明日' : `あと${daysUntilEvent}日`}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={[styles.eventTitle, { color: eventColor }]}>
              {nextEvent.name}
            </ThemedText>
            <ThemedText type="caption" style={{ color: eventMuted }}>
              {getGradeLabel(nextEvent.grade)}
            </ThemedText>
          </View>
        </View>
      )}
    </DragSafeTouchableOpacity>
  );
}

export default UpcomingEvents;

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
  statusText: {
    marginTop: 8,
    fontSize: 14,
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    flexShrink: 0,
  },
  dateText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  eventDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: Spacing.xs / 2,
  },
  relativeDate: {
    fontWeight: '700',
    marginBottom: 4,
  },
});
