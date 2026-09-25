import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Icon from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { ClassCard } from '@/components/classes/ClassCard';
import { Spacing } from '@/constants/Design';
import { ClassItem } from '@/types/classes';
import { CustomScheduleCard } from './CustomScheduleCard';
import { ResolvedScheduleInstance } from '@/types/schedule';

export type ScheduleListItem =
  | {
      type: 'class';
      id: string;
      startTime: string;
      endTime: string;
      classItem: ClassItem;
      periodIndex: number;
    }
  | {
      type: 'custom';
      id: string;
      startTime: string;
      endTime: string;
      resolved: ResolvedScheduleInstance;
    };

interface ScheduleListProps {
  items: ScheduleListItem[];
  colorScheme: 'light' | 'dark';
  textColor: string;
  borderColor: string;
  loadingCustom?: boolean;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ScheduleList({
  items,
  colorScheme,
  textColor,
  borderColor,
  loadingCustom = false,
  onAdd,
  onEdit,
  onDelete,
}: ScheduleListProps) {
  const accent = Colors[colorScheme].accent;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow} accessibilityRole="header">
        <View style={styles.headerTextContainer}>
          <ThemedText style={[styles.heading, { color: textColor }]}>1日の予定</ThemedText>
          <ThemedText style={[styles.subheading, { color: textColor }]}>授業と予定がすべて表示されます</ThemedText>
        </View>
        <DragSafeTouchableOpacity 
          onPress={onAdd} 
          style={[styles.addButton, { backgroundColor: accent }]} 
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="予定を追加"
          accessibilityHint="新しい予定を追加します"
        >
          <Icon name="plus-circle" size={20} color="#fff" style={{ marginRight: 6 }} accessibilityElementsHidden={true} />
          <ThemedText style={styles.addText}>予定を追加</ThemedText>
        </DragSafeTouchableOpacity>
      </View>

      {loadingCustom && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={accent} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>予定を読み込み中...</ThemedText>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="calendar-remove-outline" size={40} color={Colors[colorScheme].icon} style={{ marginBottom: Spacing.xs }} />
          <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.7 }]}>予定が登録されていません</ThemedText>
          <ThemedText style={[styles.emptyCaption, { color: textColor, opacity: 0.6 }]}>右上の「追加」から予定を登録できます</ThemedText>
        </View>
      ) : (
        <View>
          {items.map(item => {
            if (item.type === 'class') {
              return (
                <ClassCard
                  key={item.id}
                  item={item.classItem}
                  index={item.periodIndex}
                  colorScheme={colorScheme}
                  textColor={textColor}
                  borderColor={borderColor}
                />
              );
            }

            return (
              <CustomScheduleCard
                key={item.id}
                item={item.resolved}
                colorScheme={colorScheme}
                textColor={textColor}
                borderColor={borderColor}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subheading: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs - 2,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    marginLeft: Spacing.xs,
    fontSize: 14,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl + Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCaption: {
    fontSize: 13,
    marginTop: Spacing.xs / 2,
    textAlign: 'center',
  },
});
