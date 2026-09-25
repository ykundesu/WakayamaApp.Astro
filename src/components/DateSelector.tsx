import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import Icon from '@/components/ui/AppIcon';
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";
import React, { useState } from "react";
import CalendarModal from "@/components/ui/Calendar";

// date文字列をAPIと同じYYYY-M-D形式に変換
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 日付表示用に曜日を追加する関数
function formatDisplayDate(date: Date): string {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const base = formatDate(date);
  const weekday = weekdays[date.getDay()];
  return `${base} (${weekday})`;
}

export default function DateSelector({
  currentDate,
  setCurrentDate,
  hasPrev,
  hasNext,
  changeDate,
}: {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  hasPrev: boolean;
  hasNext: boolean;
  changeDate: (offset: number) => void;
}) {
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({ light: Colors.light.accent, dark: Colors.dark.accent }, 'tint');
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <View>
      <View style={[styles.dateCard, { backgroundColor: cardBackground }]}>
        <TouchableOpacity
          onPress={() => changeDate(-1)}
          disabled={!hasPrev}
          style={[styles.dateNavBtn, !hasPrev && styles.disabledNavBtn]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="前の日"
          accessibilityState={{ disabled: !hasPrev }}
          accessibilityHint={hasPrev ? "前の日に移動します" : "これ以上前の日はありません"}
        >
          <Icon name="chevron-left" size={28} color={hasPrev ? tintColor : "#ccc"} accessibilityElementsHidden={true} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`日付選択: ${formatDisplayDate(currentDate)}`}
          accessibilityHint="カレンダーを開いて日付を選択します"
        >
          <ThemedText type="title" style={[styles.dateText, { color: textColor }]}>
            {formatDisplayDate(currentDate)}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => changeDate(1)}
          disabled={!hasNext}
          style={[styles.dateNavBtn, !hasNext && styles.disabledNavBtn]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="次の日"
          accessibilityState={{ disabled: !hasNext }}
          accessibilityHint={hasNext ? "次の日に移動します" : "これ以上先の日はありません"}
        >
          <Icon name="chevron-right" size={28} color={hasNext ? tintColor : "#ccc"} accessibilityElementsHidden={true} />
        </TouchableOpacity>
      </View>
      <CalendarModal
        visible={showDatePicker}
        selectedDate={currentDate}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(date) => {
          setCurrentDate(date);
          setShowDatePicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dateNavBtn: {
    padding: 8,
    borderRadius: 20,
  },
  disabledNavBtn: {
    opacity: 0.3,
  },
  dateText: {
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
