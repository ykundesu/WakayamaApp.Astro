import React, { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import Icon from '@/components/ui/AppIcon';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { ClassItem } from '@/hooks/useClasses';
import { useMountAnimation } from '@/hooks/useMountAnimation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { motionTimingConfig } from '@/utils/motion';

type TodayClassesProps = {
  classes: ClassItem[];
  loading: boolean;
  error: string | null;
};

const periodColors = [
  { primary: '#FF6B6B', secondary: '#FFE5E5' },
  { primary: '#4ECDC4', secondary: '#E8F8F7' },
  { primary: '#45B7D1', secondary: '#E8F4FD' },
  { primary: '#96CEB4', secondary: '#F0F9F4' },
  { primary: '#FECA57', secondary: '#FFF8E1' },
  { primary: '#A29BFE', secondary: '#F1F0FF' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(DragSafeTouchableOpacity);

function getCurrentClass(classes: ClassItem[]): { current: ClassItem | null; next: ClassItem | null; index: number } {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < classes.length; i++) {
    const classItem = classes[i];
    const [startHour, startMin] = classItem.start.split(':').map(Number);
    const [endHour, endMin] = classItem.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (currentTime >= startTime && currentTime <= endTime) {
      return {
        current: classItem,
        next: classes[i + 1] || null,
        index: i,
      };
    }

    if (currentTime < startTime) {
      return {
        current: null,
        next: classItem,
        index: i,
      };
    }
  }

  return { current: null, next: null, index: -1 };
}

export function TodayClasses({ classes, loading, error }: TodayClassesProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: Colors.light.border, dark: Colors.dark.border }, 'text');
  const accentColorValue = useThemeColor({}, 'accent');
  const { current, next, index } = getCurrentClass(classes);

  const navigateToClasses = () => {
    router.push('/(tabs)/classes');
  };

  const isLoading = loading && classes.length === 0;
  const hasError = Boolean(error);
  const isEmpty = !isLoading && !hasError && classes.length === 0;

  const currentKey = current ? `${current.name}-${current.start}` : 'none';
  const nextKey = next ? `${next.name}-${next.start}` : 'none';
  const finishedKey = !current && !next && !isLoading && !hasError && !isEmpty ? 'finished' : 'none';

  const cardEntranceStyle = useMountAnimation({
    trigger: `${classes.length}-${Number(isLoading)}-${Number(hasError)}`,
    duration: 'regular',
    offset: 16,
  });
  const loadingStyle = useMountAnimation({
    trigger: isLoading ? 'loading' : 'idle',
    duration: 'quick',
    offset: 12,
  });
  const errorStyle = useMountAnimation({
    trigger: hasError ? 'error' : 'idle',
    duration: 'quick',
    offset: 12,
  });
  const emptyStyle = useMountAnimation({
    trigger: isEmpty ? 'empty' : 'idle',
    duration: 'quick',
    offset: 12,
  });
  const currentSectionStyle = useMountAnimation({
    trigger: currentKey,
    duration: 'regular',
    offset: 12,
  });
  const currentBadgeStyle = useMountAnimation({
    trigger: `${currentKey}-badge`,
    duration: 'quick',
    axis: 'y',
    offset: -6,
  });
  const nextSectionStyle = useMountAnimation({
    trigger: nextKey,
    duration: 'regular',
    offset: 12,
  });
  const nextBadgeStyle = useMountAnimation({
    trigger: `${nextKey}-badge`,
    duration: 'quick',
    axis: 'y',
    offset: -6,
  });
  const finishedStyle = useMountAnimation({
    trigger: finishedKey,
    duration: 'quick',
    offset: 12,
  });

  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(cardScale, {
      toValue: 0.97,
      useNativeDriver: true,
      ...motionTimingConfig('quick', 'standard'),
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      ...motionTimingConfig('quick', 'standard'),
    }).start();
  };

  const handlePress = () => {
    handlePressOut();
    navigateToClasses();
  };

  const cardAnimatedStyle = {
    opacity: cardEntranceStyle.opacity,
    transform: [
      ...(cardEntranceStyle.transform ?? []),
      { scale: cardScale },
    ],
  };

  return (
    <AnimatedTouchable
      style={[
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor: current ? accentColorValue : borderColor,
        },
        cardAnimatedStyle,
      ]}
      activeOpacity={0.92}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="今日の授業"
      accessibilityHint="詳細な授業スケジュールを確認します。タップして移動"
    >
      <View style={styles.header}>
        <Icon name="school" size={24} color={accentColorValue} accessibilityElementsHidden={true} />
        <ThemedText type="subtitle" style={styles.title}>今日の授業</ThemedText>
        <Icon name="chevron-right" size={20} color={Colors[colorScheme].icon} accessibilityElementsHidden={true} />
      </View>

      {isLoading && (
        <Animated.View style={[styles.centered, loadingStyle]}>
          <Icon name="progress-clock" size={32} color={accentColorValue} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>読み込み中...</ThemedText>
        </Animated.View>
      )}

      {hasError && (
        <Animated.View style={[styles.centered, errorStyle]}>
          <Icon name="alert-circle-outline" size={32} color="#FF6B6B" />
          <ThemedText style={[styles.errorText, { color: textColor }]}>エラーが発生しました</ThemedText>
        </Animated.View>
      )}

      {isEmpty && (
        <Animated.View style={[styles.centered, emptyStyle]}>
          <Icon name="calendar-blank" size={32} color={Colors[colorScheme].icon} />
          <ThemedText style={[styles.noClassText, { color: textColor }]}>今日は授業がありません</ThemedText>
        </Animated.View>
      )}

      {!isLoading && !hasError && !isEmpty && current && (
        <Animated.View style={[styles.currentClass, currentSectionStyle]}>
          <Animated.View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }, currentBadgeStyle]}>
            <ThemedText style={styles.statusText}>進行中</ThemedText>
          </Animated.View>
          <View style={styles.classInfo}>
            <View
              style={[
                styles.periodIndicator,
                {
                  backgroundColor: periodColors[index]?.secondary || '#F0F0F0',
                  borderColor: periodColors[index]?.primary || '#666',
                },
              ]}
            >
              <ThemedText style={{ fontSize: 14, fontWeight: '800', color: periodColors[index]?.primary || '#666' }}>
                {(index + 1).toString()}
              </ThemedText>
            </View>
            <View style={styles.classDetails}>
              <ThemedText type="defaultSemiBold" style={[styles.className, { color: textColor }]}>
                {current.name}
              </ThemedText>
              <ThemedText style={[styles.classTime, { color: Colors[colorScheme].icon }]}>
                {current.start} - {current.end}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      )}

      {!isLoading && !hasError && !isEmpty && next && (
        <Animated.View style={[styles.nextClass, nextSectionStyle]}>
          <Animated.View style={[styles.statusBadge, { backgroundColor: accentColorValue }, nextBadgeStyle]}>
            <ThemedText style={styles.statusText}>次の授業</ThemedText>
          </Animated.View>
          <View style={styles.classInfo}>
            <View
              style={[
                styles.periodIndicator,
                {
                  backgroundColor: periodColors[current ? index + 1 : index]?.secondary || '#F0F0F0',
                  borderColor: periodColors[current ? index + 1 : index]?.primary || '#666',
                },
              ]}
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: periodColors[current ? index + 1 : index]?.primary || '#666',
                }}
              >
                {(current ? index + 2 : index + 1).toString()}
              </ThemedText>
            </View>
            <View style={styles.classDetails}>
              <ThemedText type="defaultSemiBold" style={[styles.className, { color: textColor }]}>
                {next.name}
              </ThemedText>
              <ThemedText style={[styles.classTime, { color: Colors[colorScheme].icon }]}>
                {next.start} - {next.end}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      )}

      {!isLoading && !hasError && !isEmpty && !current && !next && (
        <Animated.View style={[styles.centered, finishedStyle]}>
          <Icon name="check-circle" size={32} color="#4CAF50" />
          <ThemedText style={[styles.finishedText, { color: textColor }]}>今日の授業は終了しました</ThemedText>
        </Animated.View>
      )}

      {!isLoading && !hasError && !isEmpty && (
        <View style={styles.footer}>
          <ThemedText style={[styles.totalClasses, { color: Colors[colorScheme].icon }]}>
            全{classes.length}限
          </ThemedText>
        </View>
      )}
    </AnimatedTouchable>
  );
}

export default TodayClasses;

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
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  noClassText: {
    marginTop: 8,
    fontSize: 14,
  },
  finishedText: {
    marginTop: 8,
    fontSize: 14,
  },
  currentClass: {
    marginBottom: 12,
  },
  nextClass: {
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  classDetails: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    marginBottom: 2,
  },
  classTime: {
    fontSize: 14,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  totalClasses: {
    fontSize: 12,
  },
});
