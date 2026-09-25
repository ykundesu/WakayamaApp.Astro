import { Modal, TouchableWithoutFeedback, View, Animated, StyleSheet } from 'react-native';
import { StudentClass } from '@/contexts/SettingsContext';
import { ThemedText } from '@/components/ThemedText';
import Icon from '@/components/ui/AppIcon';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Design';
import { getFiscalYear } from '@/utils/classesUtils';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';

/**
 * SettingsModalコンポーネントのプロパティ
 */
interface SettingsModalProps {
  /** モーダルの表示状態 */
  visible: boolean;
  
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  
  /** 設定を適用する時のコールバック */
  onApply: () => void;
  
  /** 一時的な年度（対象年度） */
  tempYear: number | null;
  
  /** 年度を変更する関数 */
  setTempYear: (year: number | null) => void;
  
  /** 一時的な学年 */
  tempGrade: number;
  
  /** 学年を変更する関数 */
  setTempGrade: (grade: number) => void;
  
  /** 一時的なクラス */
  tempClass: StudentClass;
  
  /** クラスを変更する関数 */
  setTempClass: (cls: StudentClass) => void;
  
  /** 一時的な学期 */
  tempSemester: '0' | '1';
  
  /** 学期を変更する関数 */
  setTempSemester: (semester: '0' | '1') => void;
  
  /** 一時的な曜日インデックス */
  tempDayOfWeek: number;
  
  /** 曜日を変更する関数 */
  setTempDayOfWeek: (day: number) => void;
  
  /** モーダルのスライドアニメーション値 */
  modalSlide: Animated.Value;
  
  /** カードの背景色 */
  cardBackground: string;
  
  /** テキストの色 */
  textColor: string;
  
  /** ボーダーの色 */
  borderColor: string;
  
  /** 背景色 */
  backgroundColor: string;
  
  /** カラースキーム */
  colorScheme: 'light' | 'dark';
}

/**
 * 授業設定モーダルコンポーネント
 * 
 * 授業時間割の表示条件を設定するためのモーダルです。
 * 
 * 設定項目:
 * - 年度: 対象とする年度
 * - 学年: 1〜5年生
 * - クラス: A, B, C, D
 * - 学期: 前期/後期
 * - 曜日: 月〜金
 * 
 * @param props - コンポーネントのプロパティ
 * 
 * @example
 * ```tsx
 * <SettingsModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   onApply={handleApply}
 *   tempYear={2025}
 *   setTempYear={setTempYear}
 *   // ... 他のプロパティ
 * />
 * ```
 */
export function SettingsModal({
  visible,
  onClose,
  onApply,
  tempYear,
  setTempYear,
  tempGrade,
  setTempGrade,
  tempClass,
  setTempClass,
  tempSemester,
  setTempSemester,
  tempDayOfWeek,
  setTempDayOfWeek,
  modalSlide,
  cardBackground,
  textColor,
  borderColor,
  backgroundColor,
  colorScheme,
}: SettingsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View 
              style={[
                styles.modalContent,
                { 
                  backgroundColor: cardBackground,
                  transform: [{ 
                    translateY: modalSlide.interpolate({ inputRange: [0, 1], outputRange: [60, 0] })
                  }],
                  opacity: modalSlide,
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>
                  設定
                </ThemedText>
                <DragSafeTouchableOpacity onPress={onClose}>
                  <Icon name="close" size={28} color={textColor} />
                </DragSafeTouchableOpacity>
              </View>
              
              <View style={styles.settingsContent}>
                {/* 横並びの設定項目 */}
                <View style={styles.horizontalSettings}>
                  {/* 年度（対象年度） */}
                  <View style={styles.settingColumn}>
                    <DragSafeTouchableOpacity 
                      onPress={() => {
                        const fiscal = getFiscalYear();
                        const currentYear = tempYear ?? fiscal;
                        const newYear = Math.min(fiscal, currentYear + 1);
                        setTempYear(newYear);
                      }}
                      style={styles.arrowBtn}
                    >
                      <Icon name="plus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                    <View style={styles.settingValue}>
                      <ThemedText style={[styles.settingLabel, { color: textColor, opacity: 0.6 }]}>
                        年度
                      </ThemedText>
                      <ThemedText style={[styles.settingText, { color: textColor }]}>
                        {tempYear ?? getFiscalYear()}
                      </ThemedText>
                    </View>
                    <DragSafeTouchableOpacity 
                      onPress={() => {
                        const fiscal = getFiscalYear();
                        const currentYear = tempYear ?? fiscal;
                        const newYear = Math.max(fiscal - 4, currentYear - 1);
                        setTempYear(newYear);
                      }}
                      style={styles.arrowBtn}
                    >
                      <Icon name="minus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                  </View>

                  {/* 学年 */}
                  <View style={styles.settingColumn}>
                    <DragSafeTouchableOpacity 
                      onPress={() => setTempGrade(Math.min(5, tempGrade + 1))}
                      style={styles.arrowBtn}
                    >
                      <Icon name="plus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                    <View style={styles.settingValue}>
                      <ThemedText style={[styles.settingLabel, { color: textColor, opacity: 0.6 }]}>
                        学年
                      </ThemedText>
                      <ThemedText style={[styles.settingText, { color: textColor }]}>
                        {tempGrade}
                      </ThemedText>
                    </View>
                    <DragSafeTouchableOpacity 
                      onPress={() => setTempGrade(Math.max(1, tempGrade - 1))}
                      style={styles.arrowBtn}
                    >
                      <Icon name="minus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                  </View>

                  {/* クラス */}
                  <View style={styles.settingColumn}>
                    <DragSafeTouchableOpacity 
                      onPress={() => {
                        const classes: StudentClass[] = ['A', 'B', 'C', 'D'];
                        const idx = classes.indexOf(tempClass);
                        setTempClass(classes[(idx + 1) % classes.length]);
                      }}
                      style={styles.arrowBtn}
                    >
                      <Icon name="plus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                    <View style={styles.settingValue}>
                      <ThemedText style={[styles.settingLabel, { color: textColor, opacity: 0.6 }]}>
                        クラス
                      </ThemedText>
                      <ThemedText style={[styles.settingText, { color: textColor }]}>
                        {tempClass}
                      </ThemedText>
                    </View>
                    <DragSafeTouchableOpacity 
                      onPress={() => {
                        const classes: StudentClass[] = ['A', 'B', 'C', 'D'];
                        const idx = classes.indexOf(tempClass);
                        setTempClass(classes[(idx - 1 + classes.length) % classes.length]);
                      }}
                      style={styles.arrowBtn}
                    >
                      <Icon name="minus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                  </View>

                  {/* 学期 */}
                  <View style={styles.settingColumn}>
                    <DragSafeTouchableOpacity 
                      onPress={() => setTempSemester('1')}
                      style={styles.arrowBtn}
                    >
                      <Icon name="plus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                    <View style={styles.settingValue}>
                      <ThemedText style={[styles.settingLabel, { color: textColor, opacity: 0.6 }]}>
                        学期
                      </ThemedText>
                      <ThemedText style={[styles.settingText, { color: textColor }]}>
                        {tempSemester === '0' ? '前期' : '後期'}
                      </ThemedText>
                    </View>
                    <DragSafeTouchableOpacity 
                      onPress={() => setTempSemester('0')}
                      style={styles.arrowBtn}
                    >
                      <Icon name="minus" size={22} color={Colors[colorScheme].icon} />
                    </DragSafeTouchableOpacity>
                  </View>
                </View>

                {/* 曜日 */}
                <View style={styles.weekdaySection}>
                  <ThemedText style={[styles.settingLabel, { color: textColor, opacity: 0.6, marginBottom: 12 }]}>
                    曜日
                  </ThemedText>
                  <View style={styles.weekdayButtons}>
                    {['月', '火', '水', '木', '金'].map((day, idx) => (
                      <DragSafeTouchableOpacity
                        key={idx}
                        onPress={() => setTempDayOfWeek(idx)}
                        style={[
                          styles.weekdayBtn,
                          { 
                            backgroundColor: tempDayOfWeek === idx 
                              ? Colors[colorScheme].accent 
                              : backgroundColor,
                            borderColor: tempDayOfWeek === idx 
                              ? Colors[colorScheme].accent 
                              : borderColor,
                          }
                        ]}
                      >
                        <ThemedText style={[
                          styles.weekdayText,
                          { 
                            color: tempDayOfWeek === idx 
                              ? '#fff' 
                              : textColor 
                          }
                        ]}>
                          {day}
                        </ThemedText>
                      </DragSafeTouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <DragSafeTouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton, { borderColor: borderColor }]}
                  onPress={onClose}
                >
                  <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>キャンセル</ThemedText>
                </DragSafeTouchableOpacity>
                <DragSafeTouchableOpacity 
                  style={[styles.modalButton, styles.applyButton, { backgroundColor: Colors[colorScheme].accent }]}
                  onPress={onApply}
                >
                  <ThemedText style={styles.modalButtonText}>適用</ThemedText>
                </DragSafeTouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  settingsContent: {
    paddingVertical: 8,
  },
  horizontalSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  settingColumn: {
    flex: 1,
    alignItems: 'center',
  },
  arrowBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  settingValue: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  settingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  weekdaySection: {
    marginTop: 20,
    paddingTop: 20,
  },
  weekdayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  weekdayBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  weekdayText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 28,
  },
  modalButton: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2.5,
  },
  applyButton: {},
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
