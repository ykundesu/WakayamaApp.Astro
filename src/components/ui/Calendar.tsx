import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Animated } from 'react-native';
import Icon from '@/components/ui/AppIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

type CalendarModalProps = {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
};

type DayCell = {
  date: Date;
  inCurrentMonth: boolean;
};

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function stripTime(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function generateCalendarDays(month: Date): DayCell[] {
  const firstOfMonth = startOfMonth(month);
  const startDay = firstOfMonth.getDay();
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startDay);

  const days: DayCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);
    days.push({
      date: cellDate,
      inCurrentMonth: cellDate.getMonth() === month.getMonth(),
    });
  }
  return days;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function CalendarModal({ visible, selectedDate, onClose, onSelectDate }: CalendarModalProps) {
  const [displayMonth, setDisplayMonth] = useState<Date>(startOfMonth(selectedDate));
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(selectedDate);
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({ light: Colors.light.accent, dark: Colors.dark.accent }, 'tint');
  const separatorColor = useThemeColor({ light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.12)' }, 'border');
  
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      setDisplayMonth(startOfMonth(selectedDate));
      setTempSelectedDate(selectedDate);
      
      // フェードインアニメーション（150ms）
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // フェードアウトアニメーション（120ms）
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.95,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible, selectedDate]);

  const days = useMemo(() => generateCalendarDays(displayMonth), [displayMonth]);
  const selected = stripTime(tempSelectedDate).getTime();
  const today = stripTime(new Date()).getTime();

  const changeMonth = (offset: number) => {
    setDisplayMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return startOfMonth(next);
    });
  };

  const changeYear = (offset: number) => {
    setDisplayMonth((prev) => {
      const next = new Date(prev);
      next.setFullYear(prev.getFullYear() + offset);
      return startOfMonth(next);
    });
  };

  const handleSelect = (date: Date) => {
    setTempSelectedDate(stripTime(date));
  };

  const handleConfirm = () => {
    onSelectDate(tempSelectedDate);
    onClose();
  };

  const handleToday = () => {
    const todayDate = new Date();
    setTempSelectedDate(stripTime(todayDate));
    setDisplayMonth(startOfMonth(todayDate));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.calendarCard, 
            { 
              backgroundColor: cardBackground,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            }
          ]}
        >
          <View accessibilityLabel="日付選択カレンダー" style={{ flex: 1 }}>
          <View style={styles.yearNav}>
            <TouchableOpacity
              onPress={() => changeYear(-1)}
              style={styles.yearNavBtn}
              accessibilityRole="button"
              accessibilityLabel="前の年へ"
            >
              <Icon name="chevron-double-left" size={20} color={tintColor} />
            </TouchableOpacity>
            <Text style={[styles.yearText, { color: textColor }]}>{displayMonth.getFullYear()}年</Text>
            <TouchableOpacity
              onPress={() => changeYear(1)}
              style={styles.yearNavBtn}
              accessibilityRole="button"
              accessibilityLabel="次の年へ"
            >
              <Icon name="chevron-double-right" size={20} color={tintColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.monthNavBtn}
              accessibilityRole="button"
              accessibilityLabel="前の月へ"
            >
              <Icon name="chevron-left" size={24} color={tintColor} />
            </TouchableOpacity>
            <Text style={[styles.headerText, { color: textColor }]}>{displayMonth.getMonth() + 1}月</Text>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.monthNavBtn}
              accessibilityRole="button"
              accessibilityLabel="次の月へ"
            >
              <Icon name="chevron-right" size={24} color={tintColor} />
            </TouchableOpacity>
          </View>
          <View style={[styles.weekHeader, { borderBottomColor: separatorColor }]}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={[styles.weekdayText, { color: textColor }]}>{day}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {days.map(({ date, inCurrentMonth }) => {
              const time = stripTime(date).getTime();
              const isSelected = time === selected;
              const isToday = time === today;
              const textStyles: any[] = [
                styles.dayText,
                { color: inCurrentMonth ? textColor : 'rgba(128,128,128,0.6)' },
              ];

              if (isSelected) {
                textStyles.push({ color: '#fff' });
              } else if (isToday) {
                textStyles.push({ color: tintColor, fontWeight: '600' });
              }

              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: tintColor },
                    isToday && !isSelected && { borderColor: tintColor, borderWidth: StyleSheet.hairlineWidth },
                  ]}
                  onPress={() => handleSelect(date)}
                  disabled={!inCurrentMonth}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.getMonth() + 1}月${date.getDate()}日を選択`}
                >
                  <Text style={textStyles}>{date.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.footer, { borderTopColor: separatorColor }]}>
            <TouchableOpacity
              style={[styles.todayButton, { borderColor: tintColor }]}
              onPress={handleToday}
              accessibilityRole="button"
              accessibilityLabel="今日の日付を選択"
            >
              <Text style={[styles.todayText, { color: tintColor }]}>今日</Text>
            </TouchableOpacity>
            <View style={styles.footerRight}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: tintColor }]}
                onPress={handleConfirm}
                accessibilityRole="button"
                accessibilityLabel="日付を決定"
              >
                <Text style={styles.confirmText}>決定</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: 'transparent', borderColor: separatorColor, borderWidth: StyleSheet.hairlineWidth }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="カレンダーを閉じる"
              >
                <Text style={[styles.closeText, { color: textColor }]}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  yearNavBtn: {
    padding: 8,
    borderRadius: 999,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 999,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
