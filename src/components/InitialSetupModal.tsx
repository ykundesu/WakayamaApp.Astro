import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from './ThemedText';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { Colors } from '@/constants/Colors';
import { StudentClass } from '@/contexts/SettingsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMountAnimation } from '@/hooks/useMountAnimation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { motionTimingConfig } from '@/utils/motion';

export interface InitialSetupModalProps {
  visible: boolean;
  onSave: (admissionYear: number | null, studentClass: StudentClass) => void;
}

export function InitialSetupModal({ visible, onSave }: InitialSetupModalProps) {
  const [admissionYear, setAdmissionYear] = useState<number | null>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const fiscalYearStart = new Date(year, 3, 1);
    return now >= fiscalYearStart ? year : year - 1;
  });
  const [studentClass, setStudentClass] = useState<StudentClass>('B');
  const [animationKey, setAnimationKey] = useState(0);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: Colors.light.border, dark: Colors.dark.border }, 'text');
  const colorScheme = useColorScheme() ?? 'light';
  const contentScale = useRef(new Animated.Value(0.94)).current;

  const getFiscalYear = (now: Date = new Date()): number => {
    const year = now.getFullYear();
    const fiscalYearStart = new Date(year, 3, 1);
    return now >= fiscalYearStart ? year : year - 1;
  };

  const handleSave = () => {
    onSave(admissionYear, studentClass);
  };

  const handleNotAdmitted = () => {
    onSave(null, studentClass);
  };

  useEffect(() => {
    if (visible) {
      setAnimationKey((prev) => prev + 1);
      Animated.timing(contentScale, {
        toValue: 1,
        useNativeDriver: true,
        ...motionTimingConfig('quick', 'entrance'),
      }).start();
      return;
    }

    contentScale.setValue(0.94);
  }, [contentScale, visible]);

  const contentAnimatedStyle = useMountAnimation({
    trigger: animationKey,
    offset: 32,
    duration: 'regular',
    easing: 'entrance',
  });

  const resolvedContentStyle = {
    backgroundColor: cardBackground,
    opacity: contentAnimatedStyle.opacity,
    transform: [
      ...(contentAnimatedStyle.transform ?? []),
      { scale: contentScale },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View testID="initial-setup-backdrop" style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            resolvedContentStyle,
          ]}
        >
          <View style={styles.header}>
            <MaterialCommunityIcons name="school-outline" size={48} color={Colors[colorScheme].accent} style={{ marginBottom: 16 }} />
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              初期設定
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
              入学年度とクラスを{"\u200B"}選択してください
            </ThemedText>
          </View>

          <View style={styles.body}>
            <View style={styles.settingItem}>
              <ThemedText style={[styles.settingLabel, { color: textColor, opacity: 0.8 }]}>
                入学年度
              </ThemedText>
              <View style={styles.settingRow}>
                <DragSafeTouchableOpacity
                  onPress={() => setAdmissionYear((prev) => {
                    if (prev === null) return getFiscalYear();
                    return Math.max(getFiscalYear() - 5, prev - 1);
                  })}
                  style={[styles.arrowBtn, { backgroundColor }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="入学年度を減らす"
                  accessibilityHint="入学年度を1年前にします"
                >
                  <MaterialCommunityIcons name="chevron-left" size={24} color={Colors[colorScheme].icon} />
                </DragSafeTouchableOpacity>
                <View style={[styles.settingValueBox, { backgroundColor }]}>
                  <ThemedText style={[styles.settingValue, { color: textColor, fontSize: 20 }]}>
                    {admissionYear === null ? '未設定' : `${admissionYear}年`}
                  </ThemedText>
                </View>
                <DragSafeTouchableOpacity
                  onPress={() => setAdmissionYear((prev) => {
                    if (prev === null) return getFiscalYear();
                    return Math.min(getFiscalYear(), prev + 1);
                  })}
                  style={[styles.arrowBtn, { backgroundColor }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="入学年度を増やす"
                  accessibilityHint="入学年度を1年先にします"
                >
                  <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[colorScheme].icon} />
                </DragSafeTouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <ThemedText style={[styles.settingLabel, { color: textColor, opacity: 0.8 }]}>
                クラス
              </ThemedText>
              <View style={styles.classButtonsRow} accessibilityRole="radiogroup" accessibilityLabel="クラス選択">
                {(['A', 'B', 'C', 'D'] as StudentClass[]).map((cls) => (
                  <DragSafeTouchableOpacity
                    key={cls}
                    onPress={() => setStudentClass(cls)}
                    style={[
                      styles.classButton,
                      {
                        backgroundColor: studentClass === cls
                          ? Colors[colorScheme].accent
                          : backgroundColor,
                        borderColor: studentClass === cls
                          ? Colors[colorScheme].accent
                          : borderColor,
                      },
                    ]}
                    accessible={true}
                    accessibilityRole="radio"
                    accessibilityLabel={`${cls}組`}
                    accessibilityState={{ selected: studentClass === cls }}
                    accessibilityHint={studentClass === cls ? '現在選択中です' : 'タップして選択します'}
                  >
                    <ThemedText
                      style={[
                        styles.classButtonText,
                        {
                          color: studentClass === cls
                            ? '#fff'
                            : textColor,
                        },
                      ]}
                    >
                      {cls}
                    </ThemedText>
                  </DragSafeTouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <DragSafeTouchableOpacity
            style={[styles.saveButton, { backgroundColor: Colors[colorScheme].accent }]}
            onPress={handleSave}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="設定を保存"
            accessibilityHint="入学年度とクラスの設定を保存して開始します"
          >
            <ThemedText style={styles.saveButtonText}>保存</ThemedText>
          </DragSafeTouchableOpacity>

          <DragSafeTouchableOpacity
            style={[styles.notAdmittedButton, { borderColor }]}
            onPress={handleNotAdmitted}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="入学していません"
            accessibilityHint="入学していない場合に選択します"
          >
            <ThemedText style={[styles.notAdmittedButtonText, { color: textColor }]}>
              入学していません
            </ThemedText>
          </DragSafeTouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  body: {
    marginBottom: 24,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  arrowBtn: {
    padding: 12,
    borderRadius: 12,
  },
  settingValueBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  classButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  classButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 12,
  },
  notAdmittedButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  notAdmittedButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});
