import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ThemedText';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import CalendarModal from '@/components/ui/Calendar';
import TimePickerModal from '@/components/ui/TimePicker';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Design';
import {
  ScheduleFormValues,
  SCHEDULE_CATEGORY_OPTIONS,
  SCHEDULE_CATEGORY_LABELS,
  SCHEDULE_RECURRENCE_OPTIONS,
  SCHEDULE_RECURRENCE_LABELS,
  WEEKDAY_PICKER_ITEMS,
} from '@/types/schedule';
import { WEEKDAY_LABELS } from '@/types/classes';

type ScheduleFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: ScheduleFormValues) => void;
  initialValues?: ScheduleFormValues;
  defaultDayOfWeek: number;
  defaultFiscalYear: number;
  colorScheme: 'light' | 'dark';
  cardBackground: string;
  textColor: string;
  accentColor: string;
  saving?: boolean;
};

type SectionProps = PropsWithChildren<{
  title: string;
  description?: string;
  textColor: string;
  icon?: string;
  accentColor?: string;
}>;

function Section({ title, description, textColor, icon, accentColor, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && (
          <View style={[styles.sectionIconContainer, { backgroundColor: accentColor ? `${accentColor}20` : 'rgba(148, 163, 184, 0.15)' }]}>
            <Icon name={icon as any} size={20} color={accentColor || textColor} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>{title}</ThemedText>
          {description ? (
            <ThemedText style={[styles.sectionDescription, { color: textColor }]}>{description}</ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function toDayOfWeekFromDate(value?: string): number | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return (date.getDay() + 6) % 7;
}

export function ScheduleFormModal({
  visible,
  onClose,
  onSubmit,
  initialValues,
  defaultDayOfWeek,
  defaultFiscalYear,
  colorScheme,
  cardBackground,
  textColor,
  accentColor,
  saving = false,
}: ScheduleFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(SCHEDULE_CATEGORY_OPTIONS[0]);
  const [recurrence, setRecurrence] = useState(SCHEDULE_RECURRENCE_OPTIONS[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([defaultDayOfWeek]);
  const [oneTimeDate, setOneTimeDate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [targetFiscalYear, setTargetFiscalYear] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Date/Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showOneTimeDatePicker, setShowOneTimeDatePicker] = useState(false);
  const [showEffectiveFromPicker, setShowEffectiveFromPicker] = useState(false);
  const [showEffectiveToPicker, setShowEffectiveToPicker] = useState(false);
  
  const headerTitle = useMemo(() => (initialValues?.id ? '予定を編集' : '予定を追加'), [initialValues?.id]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const defaults: ScheduleFormValues = initialValues ?? {
      title: '',
      category: 'other',
      recurrence: 'weekly',
      startTime: '',
      endTime: '',
      daysOfWeek: [defaultDayOfWeek],
      effectiveFrom: undefined,
      effectiveTo: undefined,
      oneTimeDate: undefined,
      targetFiscalYear: defaultFiscalYear,
      notes: undefined,
    };
    setTitle(defaults.title ?? '');
    setCategory(defaults.category);
    setRecurrence(defaults.recurrence);
    setStartTime(defaults.startTime ?? '');
    setEndTime(defaults.endTime ?? '');
    // Support both old dayOfWeek and new daysOfWeek
    const initialDays = defaults.daysOfWeek ?? (defaults.dayOfWeek !== undefined ? [defaults.dayOfWeek] : [defaultDayOfWeek]);
    setDaysOfWeek(initialDays);
    setOneTimeDate(defaults.oneTimeDate ?? '');
    setEffectiveFrom(defaults.effectiveFrom ?? '');
    setEffectiveTo(defaults.effectiveTo ?? '');
    setTargetFiscalYear((defaults.targetFiscalYear ?? defaultFiscalYear).toString());
    setNotes(defaults.notes ?? '');
    setError(null);
  }, [visible, initialValues, defaultDayOfWeek, defaultFiscalYear]);

  useEffect(() => {
    if (recurrence === 'once') {
      const derived = toDayOfWeekFromDate(oneTimeDate);
      if (typeof derived === 'number') {
        setDaysOfWeek([derived]);
      }
    }
  }, [recurrence, oneTimeDate]);

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => {
      if (prev.includes(day)) {
        // Don't allow deselecting all days
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const disableFiscalYearField = useMemo(() => {
    return !(recurrence === 'fiscalYear' || recurrence === 'semesterFirst' || recurrence === 'semesterSecond');
  }, [recurrence]);

  const showRangeFields = useMemo(() => recurrence !== 'once', [recurrence]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      setError('開始時刻と終了時刻を入力してください');
      return;
    }
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(startTime.trim()) || !timeRegex.test(endTime.trim())) {
      setError('時刻は HH:MM 形式で入力してください (例: 09:00)');
      return;
    }
    // Validate date format for one-time events
    if (recurrence === 'once' && oneTimeDate) {
      const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      if (!dateRegex.test(oneTimeDate.trim())) {
        setError('日付は YYYY-MM-DD 形式で入力してください (例: 2025-04-15)');
        return;
      }
    }
    // Validate date format for range fields
    if (effectiveFrom && effectiveFrom.trim()) {
      const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      if (!dateRegex.test(effectiveFrom.trim())) {
        setError('適用開始日は YYYY-MM-DD 形式で入力してください (例: 2025-04-01)');
        return;
      }
    }
    if (effectiveTo && effectiveTo.trim()) {
      const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      if (!dateRegex.test(effectiveTo.trim())) {
        setError('適用終了日は YYYY-MM-DD 形式で入力してください (例: 2025-07-31)');
        return;
      }
    }
    if (!disableFiscalYearField && targetFiscalYear.trim() && Number.isNaN(Number(targetFiscalYear))) {
      setError('対象年度は数字で入力してください');
      return;
    }
    if (daysOfWeek.length === 0) {
      setError('少なくとも1つの曜日を選択してください');
      return;
    }

    const resolvedFiscalYear = disableFiscalYearField
      ? undefined
      : targetFiscalYear.trim()
          ? Number(targetFiscalYear)
          : undefined;

    const payload: ScheduleFormValues = {
      ...(initialValues?.id ? { id: initialValues.id } : {}),
      title: title.trim(),
      category,
      recurrence,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      daysOfWeek,
      dayOfWeek: daysOfWeek[0], // For backward compatibility
      oneTimeDate: oneTimeDate.trim() ? oneTimeDate.trim() : undefined,
      effectiveFrom: effectiveFrom.trim() ? effectiveFrom.trim() : undefined,
      effectiveTo: effectiveTo.trim() ? effectiveTo.trim() : undefined,
      targetFiscalYear: resolvedFiscalYear,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    setError(null);
    onSubmit(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardContainer}
            >
              <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
                <View style={styles.header}>
                  <ThemedText style={[styles.title, { color: textColor }]}>{headerTitle}</ThemedText>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                  <Section 
                    title="基本情報" 
                    description="予定のタイトルとカテゴリを設定" 
                    textColor={textColor}
                    icon="information-outline"
                    accentColor={accentColor}
                  >
                    <View style={styles.field}>
                      <View style={styles.labelRow}>
                        <Icon name="format-title" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                        <ThemedText style={[styles.label, { color: textColor }]}>タイトル</ThemedText>
                      </View>
                      <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="例: 自習、部活動、委員会など"
                        placeholderTextColor={Colors[colorScheme].icon}
                        style={[styles.input, { color: textColor, borderColor: Colors[colorScheme].border }]}
                      />
                    </View>

                    <View style={styles.field}>
                      <View style={styles.labelRow}>
                        <Icon name="tag-outline" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                        <ThemedText style={[styles.label, { color: textColor }]}>カテゴリ</ThemedText>
                      </View>
                      <View style={styles.chipContainer}>
                        {SCHEDULE_CATEGORY_OPTIONS.map(option => {
                          const isActive = option === category;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => setCategory(option)}
                              style={[
                                styles.chip,
                                {
                                  borderColor: isActive ? accentColor : Colors[colorScheme].border,
                                  backgroundColor: isActive ? accentColor : 'transparent',
                                },
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.chipLabel,
                                  {
                                    color: isActive ? '#fff' : textColor,
                                  },
                                ]}
                              >
                                {SCHEDULE_CATEGORY_LABELS[option]}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.field}>
                      <View style={styles.labelRow}>
                        <Icon name="repeat" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                        <ThemedText style={[styles.label, { color: textColor }]}>繰り返し</ThemedText>
                      </View>
                      <View style={styles.chipContainer}>
                        {SCHEDULE_RECURRENCE_OPTIONS.map(option => {
                          const isActive = option === recurrence;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => setRecurrence(option)}
                              style={[
                                styles.chip,
                                {
                                  borderColor: isActive ? accentColor : Colors[colorScheme].border,
                                  backgroundColor: isActive ? accentColor : 'transparent',
                                },
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.chipLabel,
                                  {
                                    color: isActive ? '#fff' : textColor,
                                  },
                                ]}
                              >
                                {SCHEDULE_RECURRENCE_LABELS[option]}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                      <View style={styles.helperTextRow}>
                        <Icon name="information" size={12} color={textColor} style={{ opacity: 0.5, marginRight: 4 }} />
                        <ThemedText style={[styles.helperText, { color: textColor }]}>頻度により入力項目が変化</ThemedText>
                      </View>
                    </View>
                  </Section>

                  <Section 
                    title="日時設定" 
                    description="開始・終了時刻と開催曜日を指定" 
                    textColor={textColor}
                    icon="clock-outline"
                    accentColor={accentColor}
                  >
                    <View style={styles.rowFields}>
                      <View style={[styles.rowFieldItem, styles.rowFieldSpacing]}>
                        <View style={styles.labelRow}>
                          <Icon name="clock-start" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                          <ThemedText style={[styles.label, { color: textColor }]}>開始時刻</ThemedText>
                        </View>
                        <>
                          <Pressable
                            onPress={() => setShowStartTimePicker(true)}
                            style={[styles.timeButton, { borderColor: Colors[colorScheme].border }]}
                          >
                            <Icon name="clock-time-four-outline" size={18} color={Colors[colorScheme].icon} style={{ marginRight: 8 }} />
                            <ThemedText style={[styles.timeButtonText, { color: startTime ? textColor : Colors[colorScheme].icon }]}>
                              {startTime || '09:00'}
                            </ThemedText>
                          </Pressable>
                          {Platform.OS === 'web' ? (
                            <TimePickerModal
                              visible={showStartTimePicker}
                              selectedTime={startTime}
                              onClose={() => setShowStartTimePicker(false)}
                              onSelectTime={(time) => {
                                setStartTime(time);
                                setShowStartTimePicker(false);
                              }}
                            />
                          ) : (
                            showStartTimePicker && (
                              <DateTimePicker
                                value={startTime ? parseTimeString(startTime) : new Date()}
                                mode="time"
                                is24Hour={true}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                  if (Platform.OS === 'android') {
                                    setShowStartTimePicker(false);
                                  }
                                  if (event.type === 'set' && selectedDate) {
                                    setStartTime(formatTime(selectedDate));
                                    if (Platform.OS === 'ios') {
                                      setShowStartTimePicker(false);
                                    }
                                  } else if (event.type === 'dismissed') {
                                    setShowStartTimePicker(false);
                                  }
                                }}
                              />
                            )
                          )}
                        </>
                      </View>
                      <View style={styles.rowFieldItem}>
                        <View style={styles.labelRow}>
                          <Icon name="clock-end" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                          <ThemedText style={[styles.label, { color: textColor }]}>終了時刻</ThemedText>
                        </View>
                        <>
                          <Pressable
                            onPress={() => setShowEndTimePicker(true)}
                            style={[styles.timeButton, { borderColor: Colors[colorScheme].border }]}
                          >
                            <Icon name="clock-time-four-outline" size={18} color={Colors[colorScheme].icon} style={{ marginRight: 8 }} />
                            <ThemedText style={[styles.timeButtonText, { color: endTime ? textColor : Colors[colorScheme].icon }]}>
                              {endTime || '10:30'}
                            </ThemedText>
                          </Pressable>
                          {Platform.OS === 'web' ? (
                            <TimePickerModal
                              visible={showEndTimePicker}
                              selectedTime={endTime}
                              onClose={() => setShowEndTimePicker(false)}
                              onSelectTime={(time) => {
                                setEndTime(time);
                                setShowEndTimePicker(false);
                              }}
                            />
                          ) : (
                            showEndTimePicker && (
                              <DateTimePicker
                                value={endTime ? parseTimeString(endTime) : new Date()}
                                mode="time"
                                is24Hour={true}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                  if (Platform.OS === 'android') {
                                    setShowEndTimePicker(false);
                                  }
                                  if (event.type === 'set' && selectedDate) {
                                    setEndTime(formatTime(selectedDate));
                                    if (Platform.OS === 'ios') {
                                      setShowEndTimePicker(false);
                                    }
                                  } else if (event.type === 'dismissed') {
                                    setShowEndTimePicker(false);
                                  }
                                }}
                              />
                            )
                          )}
                        </>
                      </View>
                    </View>

                    {recurrence === 'once' ? (
                      <View style={styles.field}>
                        <View style={styles.labelRow}>
                          <Icon name="calendar" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                          <ThemedText style={[styles.label, { color: textColor }]}>実施日</ThemedText>
                        </View>
                        <>
                          <Pressable
                            onPress={() => setShowOneTimeDatePicker(true)}
                            style={[styles.timeButton, { borderColor: Colors[colorScheme].border }]}
                          >
                            <Icon name="calendar-month" size={18} color={Colors[colorScheme].icon} style={{ marginRight: 8 }} />
                            <ThemedText style={[styles.timeButtonText, { color: oneTimeDate ? textColor : Colors[colorScheme].icon }]}>
                              {oneTimeDate || '2025-04-15'}
                            </ThemedText>
                          </Pressable>
                          {Platform.OS === 'web' ? (
                            <CalendarModal
                              visible={showOneTimeDatePicker}
                              selectedDate={oneTimeDate ? parseDateString(oneTimeDate) : new Date()}
                              onClose={() => setShowOneTimeDatePicker(false)}
                              onSelectDate={(date) => {
                                setOneTimeDate(formatDate(date));
                                setShowOneTimeDatePicker(false);
                              }}
                            />
                          ) : (
                            showOneTimeDatePicker && (
                              <DateTimePicker
                                value={oneTimeDate ? parseDateString(oneTimeDate) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                  if (Platform.OS === 'android') {
                                    setShowOneTimeDatePicker(false);
                                  }
                                  if (event.type === 'set' && selectedDate) {
                                    setOneTimeDate(formatDate(selectedDate));
                                    if (Platform.OS === 'ios') {
                                      setShowOneTimeDatePicker(false);
                                    }
                                  } else if (event.type === 'dismissed') {
                                    setShowOneTimeDatePicker(false);
                                  }
                                }}
                              />
                            )
                          )}
                        </>
                        <View style={styles.helperTextRow}>
                          <Icon name="information" size={12} color={textColor} style={{ opacity: 0.5, marginRight: 4 }} />
                          <ThemedText style={[styles.helperText, { color: textColor }]}>日付を選択すると曜日を自動取得</ThemedText>
                        </View>
                        {daysOfWeek.length > 0 && (
                          <View style={[styles.autoDetectedBadge, { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}>
                            <Icon name="check-circle" size={14} color={accentColor} style={{ marginRight: 4 }} />
                            <ThemedText style={[styles.autoDetectedText, { color: accentColor }]}>
                              {`曜日: ${WEEKDAY_LABELS[daysOfWeek[0]]}`}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.field}>
                        <View style={styles.labelRow}>
                          <Icon name="calendar-week" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                          <ThemedText style={[styles.label, { color: textColor }]}>曜日（複数選択可）</ThemedText>
                        </View>
                        <View style={styles.weekdayChipContainer}>
                          {WEEKDAY_PICKER_ITEMS.map(option => {
                            const isActive = daysOfWeek.includes(option.value);
                            return (
                              <Pressable
                                key={option.value}
                                onPress={() => toggleDayOfWeek(option.value)}
                                style={[
                                  styles.weekdayChip,
                                  {
                                    borderColor: isActive ? accentColor : Colors[colorScheme].border,
                                    backgroundColor: isActive ? accentColor : 'transparent',
                                  },
                                ]}
                              >
                                <ThemedText
                                  style={[
                                    styles.weekdayChipLabel,
                                    {
                                      color: isActive ? '#fff' : textColor,
                                    },
                                  ]}
                                >
                                  {option.label}
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>
                        {daysOfWeek.length > 1 && (
                          <View style={styles.helperTextRow}>
                            <Icon name="check-all" size={12} color={accentColor} style={{ marginRight: 4 }} />
                            <ThemedText style={[styles.helperText, { color: textColor }]}>
                              {daysOfWeek.length}曜日選択済み
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    )}
                  </Section>

                  <Section 
                    title="適用期間" 
                    description="予定を適用する期間や年度を指定" 
                    textColor={textColor}
                    icon="calendar-range"
                    accentColor={accentColor}
                  >
                    {showRangeFields && (
                      <View style={styles.rowFields}>
                        <View style={[styles.rowFieldItem, styles.rowFieldSpacing]}>
                          <View style={styles.labelRow}>
                            <Icon name="calendar-arrow-right" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                            <ThemedText style={[styles.label, { color: textColor }]}>適用開始日</ThemedText>
                          </View>
                          <>
                            <Pressable
                              onPress={() => setShowEffectiveFromPicker(true)}
                              style={[styles.timeButton, { borderColor: Colors[colorScheme].border }]}
                            >
                              <Icon name="calendar-start" size={18} color={Colors[colorScheme].icon} style={{ marginRight: 8 }} />
                              <ThemedText style={[styles.timeButtonText, { color: effectiveFrom ? textColor : Colors[colorScheme].icon }]}>
                                {effectiveFrom || '2025-04-01'}
                              </ThemedText>
                            </Pressable>
                            {Platform.OS === 'web' ? (
                              <CalendarModal
                                visible={showEffectiveFromPicker}
                                selectedDate={effectiveFrom ? parseDateString(effectiveFrom) : new Date()}
                                onClose={() => setShowEffectiveFromPicker(false)}
                                onSelectDate={(date) => {
                                  setEffectiveFrom(formatDate(date));
                                  setShowEffectiveFromPicker(false);
                                }}
                              />
                            ) : (
                              showEffectiveFromPicker && (
                                <DateTimePicker
                                  value={effectiveFrom ? parseDateString(effectiveFrom) : new Date()}
                                  mode="date"
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                      setShowEffectiveFromPicker(false);
                                    }
                                    if (event.type === 'set' && selectedDate) {
                                      setEffectiveFrom(formatDate(selectedDate));
                                      if (Platform.OS === 'ios') {
                                        setShowEffectiveFromPicker(false);
                                      }
                                    } else if (event.type === 'dismissed') {
                                      setShowEffectiveFromPicker(false);
                                    }
                                  }}
                                />
                              )
                            )}
                          </>
                        </View>
                        <View style={styles.rowFieldItem}>
                          <View style={styles.labelRow}>
                            <Icon name="calendar-arrow-left" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                            <ThemedText style={[styles.label, { color: textColor }]}>適用終了日</ThemedText>
                          </View>
                          <>
                            <Pressable
                              onPress={() => setShowEffectiveToPicker(true)}
                              style={[styles.timeButton, { borderColor: Colors[colorScheme].border }]}
                            >
                              <Icon name="calendar-end" size={18} color={Colors[colorScheme].icon} style={{ marginRight: 8 }} />
                              <ThemedText style={[styles.timeButtonText, { color: effectiveTo ? textColor : Colors[colorScheme].icon }]}>
                                {effectiveTo || '2025-07-31'}
                              </ThemedText>
                            </Pressable>
                            {Platform.OS === 'web' ? (
                              <CalendarModal
                                visible={showEffectiveToPicker}
                                selectedDate={effectiveTo ? parseDateString(effectiveTo) : new Date()}
                                onClose={() => setShowEffectiveToPicker(false)}
                                onSelectDate={(date) => {
                                  setEffectiveTo(formatDate(date));
                                  setShowEffectiveToPicker(false);
                                }}
                              />
                            ) : (
                              showEffectiveToPicker && (
                                <DateTimePicker
                                  value={effectiveTo ? parseDateString(effectiveTo) : new Date()}
                                  mode="date"
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                      setShowEffectiveToPicker(false);
                                    }
                                    if (event.type === 'set' && selectedDate) {
                                      setEffectiveTo(formatDate(selectedDate));
                                      if (Platform.OS === 'ios') {
                                        setShowEffectiveToPicker(false);
                                      }
                                    } else if (event.type === 'dismissed') {
                                      setShowEffectiveToPicker(false);
                                    }
                                  }}
                                />
                              )
                            )}
                          </>
                        </View>
                      </View>
                    )}

                    {!disableFiscalYearField && (
                      <View style={styles.field}>
                        <View style={styles.labelRow}>
                          <Icon name="calendar-text" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                          <ThemedText style={[styles.label, { color: textColor }]}>対象年度</ThemedText>
                        </View>
                        <View style={styles.timeInputContainer}>
                          <Icon name="numeric" size={18} color={Colors[colorScheme].icon} style={styles.inputIcon} />
                          <TextInput
                            value={targetFiscalYear}
                            onChangeText={setTargetFiscalYear}
                            placeholder={defaultFiscalYear.toString()}
                            placeholderTextColor={Colors[colorScheme].icon}
                            editable={!disableFiscalYearField}
                            style={[styles.input, styles.inputWithIcon, { color: textColor, borderColor: Colors[colorScheme].border }]}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    )}

                    {disableFiscalYearField && (
                      <View style={[styles.infoBadge, { backgroundColor: `${accentColor}10`, borderColor: `${accentColor}40` }]}>
                        <Icon name="information" size={16} color={accentColor} style={{ marginRight: 6 }} />
                        <ThemedText style={[styles.helperText, { color: textColor }]}>年度は繰り返し設定に応じて自動計算されます</ThemedText>
                      </View>
                    )}
                  </Section>

                  <Section 
                    title="メモ" 
                    description="任意で補足情報を記録" 
                    textColor={textColor}
                    icon="note-text-outline"
                    accentColor={accentColor}
                  >
                    <View style={styles.field}>
                      <View style={styles.labelRow}>
                        <Icon name="pencil-outline" size={16} color={textColor} style={{ opacity: 0.7, marginRight: 6 }} />
                        <ThemedText style={[styles.label, { color: textColor }]}>備考</ThemedText>
                      </View>
                      <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="場所や持ち物などを記録できます"
                        placeholderTextColor={Colors[colorScheme].icon}
                        style={[styles.input, styles.textArea, { color: textColor, borderColor: Colors[colorScheme].border }]}
                        multiline
                        numberOfLines={4}
                      />
                    </View>
                  </Section>

                  {error && (
                    <View style={styles.errorBox}>
                      <Icon name="alert-circle" size={18} color={Colors[colorScheme].error} style={{ marginRight: 8 }} />
                      <ThemedText style={[styles.errorText, { color: Colors[colorScheme].error }]}>{error}</ThemedText>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.footer}>
                  <DragSafeTouchableOpacity 
                    onPress={onClose} 
                    style={[styles.footerButton, styles.cancelButton, { borderWidth: 1.5, borderColor: 'rgba(148, 163, 184, 0.3)' }]}
                  >
                    <Icon name="close" size={18} color={textColor} style={{ marginRight: 6 }} />
                    <ThemedText style={[styles.footerText, { color: textColor }]}>キャンセル</ThemedText>
                  </DragSafeTouchableOpacity>
                  <DragSafeTouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.footerButton, styles.saveButton, { backgroundColor: accentColor }]}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="check" size={20} color="#fff" style={{ marginRight: 6 }} />
                        <ThemedText style={[styles.footerText, { color: '#fff' }]}>保存</ThemedText>
                      </>
                    )}
                  </DragSafeTouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  closeButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionDescription: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionBody: {
    gap: Spacing.sm,
  },
  field: {
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm - 2,
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  inputWithIcon: {
    paddingLeft: 40,
  },
  timeInputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: Platform.OS === 'ios' ? 14 : 12,
    zIndex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  rowFieldItem: {
    flex: 1,
  },
  rowFieldSpacing: {
    marginRight: Spacing.md,
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  helperText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: Spacing.xs / 2,
    lineHeight: 14,
  },
  helperTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs / 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs / 2,
  },
  chip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  chipLabel: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm - 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  timeButtonText: {
    fontSize: 15,
  },
  weekdayChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs / 2,
  },
  weekdayChip: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  weekdayChipLabel: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  autoDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs - 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  autoDetectedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg + 4,
    borderRadius: Radius.lg,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  footerText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
