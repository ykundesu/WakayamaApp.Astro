import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { IconSize, Radius, Spacing } from '@/constants/Design';
import {
  ResolvedScheduleInstance,
  SCHEDULE_CATEGORY_LABELS,
  SCHEDULE_RECURRENCE_LABELS,
} from '@/types/schedule';

interface CustomScheduleCardProps {
  item: ResolvedScheduleInstance;
  colorScheme: 'light' | 'dark';
  textColor: string;
  borderColor: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CustomScheduleCard({
  item,
  colorScheme,
  textColor,
  borderColor,
  onEdit,
  onDelete,
}: CustomScheduleCardProps) {
  const isDark = colorScheme === 'dark';
  const accent = Colors[colorScheme].accent;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study':
        return 'book-open-variant';
      case 'club':
        return 'soccer';
      case 'committee':
        return 'account-group';
      case 'event':
        return 'star';
      case 'other':
      default:
        return 'calendar-star';
    }
  };

  return (
    <Card
      elevation="md"
      style={[
        styles.container,
        isDark && {
          borderWidth: 1,
          borderColor,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${accent}20` }]}>
          <Icon name={getCategoryIcon(item.category) as any} size={24} color={accent} />
        </View>
        <View style={styles.titleColumn}>
          <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <View style={styles.metaRow}>
            <View style={[styles.badge, styles.categoryBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}> 
              <Icon name="tag" size={12} color={accent} style={{ marginRight: 4 }} />
              <ThemedText style={[styles.badgeText, { color: accent }]}> 
                {SCHEDULE_CATEGORY_LABELS[item.category]}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.25)' }]}> 
              <Icon name="repeat" size={12} color={textColor} style={{ marginRight: 4, opacity: 0.7 }} />
              <ThemedText style={[styles.badgeText, { color: textColor, opacity: 0.75 }]}> 
                {SCHEDULE_RECURRENCE_LABELS[item.recurrence]}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <DragSafeTouchableOpacity
            onPress={() => onEdit(item.entryId)}
            style={[styles.actionButton, { backgroundColor: `${accent}15` }]}
            activeOpacity={0.7}
          >
            <Icon name="pencil" size={IconSize.sm} color={accent} />
          </DragSafeTouchableOpacity>
          <DragSafeTouchableOpacity
            onPress={() => onDelete(item.entryId)}
            style={[styles.actionButton, { marginLeft: Spacing.xs, backgroundColor: `${Colors[colorScheme].error}15` }]}
            activeOpacity={0.7}
          >
            <Icon name="delete" size={IconSize.sm} color={Colors[colorScheme].error} />
          </DragSafeTouchableOpacity>
        </View>
      </View>

      <View style={[styles.infoSection, { backgroundColor: isDark ? 'rgba(148,163,184,0.05)' : 'rgba(148,163,184,0.08)' }]}>
        <View style={styles.row}>
          <View style={[styles.infoIconContainer, { backgroundColor: `${accent}20` }]}>
            <Icon name="clock-outline" size={16} color={accent} />
          </View>
          <ThemedText style={[styles.timeText, { color: textColor }]}>
            {item.startTime} - {item.endTime}
          </ThemedText>
        </View>

        <View style={styles.row}>
          <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(148,163,184,0.2)' }]}>
            <Icon name="calendar-outline" size={16} color={textColor} style={{ opacity: 0.8 }} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.secondaryText, { color: textColor, opacity: 0.8 }]}> 
              {item.occurrenceDate}
            </ThemedText>
            {item.effectiveFrom || item.effectiveTo ? (
              <ThemedText style={[styles.captionText, { color: textColor, opacity: 0.6 }]}> 
                {`適用期間: ${item.effectiveFrom ?? '制限なし'} ~ ${item.effectiveTo ?? '制限なし'}`}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </View>

      {item.notes ? (
        <View style={[styles.notesSection, { backgroundColor: isDark ? 'rgba(148,163,184,0.05)' : 'rgba(148,163,184,0.06)', borderColor: 'rgba(148,163,184,0.15)' }]}> 
          <Icon name="note-text" size={16} color={Colors[colorScheme].icon} style={{ marginRight: Spacing.xs, opacity: 0.7 }} />
          <ThemedText style={[styles.notesText, { color: textColor }]} numberOfLines={3}>
            {item.notes}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    padding: Spacing.md + 2,
    borderRadius: Radius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  titleColumn: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs - 2,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs / 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  categoryBadge: {
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.xs + 2,
    borderRadius: Radius.md,
  },
  infoSection: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm - 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  captionText: {
    fontSize: 12,
    marginTop: 2,
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
});
