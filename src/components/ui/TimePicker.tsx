import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Animated } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

type TimePickerModalProps = {
  visible: boolean;
  selectedTime: string; // HH:MM format
  onClose: () => void;
  onSelectTime: (time: string) => void; // HH:MM format
};

export default function TimePickerModal({ visible, selectedTime, onClose, onSelectTime }: TimePickerModalProps) {
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);
  const currentHourRef = useRef(9);
  const currentMinuteRef = useRef(0);
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({ light: Colors.light.accent, dark: Colors.dark.accent }, 'tint');
  const separatorColor = useThemeColor({ light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.12)' }, 'border');
  
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      // Parse selectedTime or use default
      if (selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const hour = isNaN(hours) ? 9 : hours;
        const minute = isNaN(minutes) ? 0 : minutes;
        setTempHour(hour);
        setTempMinute(minute);
        currentHourRef.current = hour;
        currentMinuteRef.current = minute;
      } else {
        setTempHour(9);
        setTempMinute(0);
        currentHourRef.current = 9;
        currentMinuteRef.current = 0;
      }
      
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
  }, [visible, selectedTime]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const formattedTime = `${currentHourRef.current.toString().padStart(2, '0')}:${currentMinuteRef.current.toString().padStart(2, '0')}`;
    onSelectTime(formattedTime);
    onClose();
  };

  const handleNow = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    setTempHour(hour);
    setTempMinute(minute);
    currentHourRef.current = hour;
    currentMinuteRef.current = minute;
  };

  const scrollToItem = (
    scrollViewRef: React.RefObject<ScrollView>,
    index: number,
    itemHeight: number,
    animated: boolean = true,
  ) => {
    scrollViewRef.current?.scrollTo({
      y: index * itemHeight,
      animated,
    });
  };

  const HourScrollView = () => {
    const scrollViewRef = useRef<ScrollView>(null);
    const itemHeight = 50;
    const [localHour, setLocalHour] = useState(tempHour);
    const isScrollingRef = useRef(false);

    useEffect(() => {
      if (visible) {
        setLocalHour(tempHour);
        setTimeout(() => {
          scrollToItem(scrollViewRef, tempHour, itemHeight);
        }, 100);
      }
    }, [visible]);

    useEffect(() => {
      if (!isScrollingRef.current) {
        setLocalHour(tempHour);
      }
    }, [tempHour]);

    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          onScrollBeginDrag={() => {
            isScrollingRef.current = true;
          }}
          onScroll={(event) => {
            if (!isScrollingRef.current) {
              isScrollingRef.current = true;
            }
            const offsetY = Math.max(0, event.nativeEvent.contentOffset.y);
            const index = Math.round(offsetY / itemHeight);
            const clampedIndex = Math.max(0, Math.min(23, index));
            setLocalHour(clampedIndex);
            currentHourRef.current = clampedIndex;
          }}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            isScrollingRef.current = false;
            const offsetY = event.nativeEvent.contentOffset.y;
            const index = Math.round(offsetY / itemHeight);
            const clampedIndex = Math.max(0, Math.min(23, index));
            setTempHour(clampedIndex);
            setLocalHour(clampedIndex);
            currentHourRef.current = clampedIndex;
          }}
          onScrollEndDrag={(event) => {
            isScrollingRef.current = false;
            const offsetY = event.nativeEvent.contentOffset.y;
            const index = Math.round(offsetY / itemHeight);
            const clampedIndex = Math.max(0, Math.min(23, index));
            setTempHour(clampedIndex);
            setLocalHour(clampedIndex);
            currentHourRef.current = clampedIndex;
          }}
        >
          {hours.map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.pickerItem,
                { height: itemHeight },
                localHour === hour && { backgroundColor: tintColor + '20' },
              ]}
              onPress={() => {
                setTempHour(hour);
                setLocalHour(hour);
                currentHourRef.current = hour;
                scrollToItem(scrollViewRef, hour, itemHeight, false);
              }}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: localHour === hour ? tintColor : textColor },
                  localHour === hour && styles.pickerItemTextSelected,
                ]}
              >
                {hour.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={[styles.pickerIndicator, { borderColor: separatorColor }]} />
      </View>
    );
  };

  const MinuteScrollView = () => {
    const scrollViewRef = useRef<ScrollView>(null);
    const itemHeight = 50;
    const [localMinute, setLocalMinute] = useState(tempMinute);
    const isScrollingRef = useRef(false);

    useEffect(() => {
      if (visible) {
        setLocalMinute(tempMinute);
        setTimeout(() => {
          scrollToItem(scrollViewRef, tempMinute, itemHeight);
        }, 100);
      }
    }, [visible]);

    useEffect(() => {
      if (!isScrollingRef.current) {
        setLocalMinute(tempMinute);
      }
    }, [tempMinute]);

    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          onScrollBeginDrag={() => {
            isScrollingRef.current = true;
          }}
          onScroll={(event) => {
            if (!isScrollingRef.current) {
              isScrollingRef.current = true;
            }
            const offsetY = Math.max(0, event.nativeEvent.contentOffset.y);
            const index = Math.round(offsetY / itemHeight);
            const clampedIndex = Math.max(0, Math.min(59, index));
            setLocalMinute(clampedIndex);
            currentMinuteRef.current = clampedIndex;
          }}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            isScrollingRef.current = false;
            const offsetY = event.nativeEvent.contentOffset.y;
            const index = Math.round(offsetY / itemHeight);
            const clampedIndex = Math.max(0, Math.min(59, index));
            setTempMinute(clampedIndex);
            setLocalMinute(clampedIndex);
            currentMinuteRef.current = clampedIndex;
          }}
          onScrollEndDrag={(event) => {
            isScrollingRef.current = false;
            const offsetY = event.nativeEvent.contentOffset.y;
            const index = Math.round(offsetY / itemHeight);
            const clampedIndex = Math.max(0, Math.min(59, index));
            setTempMinute(clampedIndex);
            setLocalMinute(clampedIndex);
            currentMinuteRef.current = clampedIndex;
          }}
        >
          {minutes.map((minute) => (
            <TouchableOpacity
              key={minute}
              style={[
                styles.pickerItem,
                { height: itemHeight },
                localMinute === minute && { backgroundColor: tintColor + '20' },
              ]}
              onPress={() => {
                setTempMinute(minute);
                setLocalMinute(minute);
                currentMinuteRef.current = minute;
                scrollToItem(scrollViewRef, minute, itemHeight, false);
              }}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: localMinute === minute ? tintColor : textColor },
                  localMinute === minute && styles.pickerItemTextSelected,
                ]}
              >
                {minute.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={[styles.pickerIndicator, { borderColor: separatorColor }]} />
      </View>
    );
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
            styles.timeCard, 
            { 
              backgroundColor: cardBackground,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            }
          ]}
        >
          <View accessibilityLabel="時刻選択" style={{ flex: 1 }}>
            <View style={styles.header}>
              <Icon name="clock-time-four-outline" size={24} color={tintColor} />
              <Text style={[styles.headerText, { color: textColor }]}>時刻を選択</Text>
            </View>
            
            <View style={styles.pickerContainer}>
              <HourScrollView />
              <Text style={[styles.separator, { color: textColor }]}>:</Text>
              <MinuteScrollView />
            </View>

            <View style={[styles.footer, { borderTopColor: separatorColor }]}>
              <TouchableOpacity
                style={[styles.nowButton, { borderColor: tintColor }]}
                onPress={handleNow}
                accessibilityRole="button"
                accessibilityLabel="現在時刻を選択"
              >
                <Text style={[styles.nowText, { color: tintColor }]}>現在時刻</Text>
              </TouchableOpacity>
              <View style={styles.footerRight}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: tintColor }]}
                  onPress={handleConfirm}
                  accessibilityRole="button"
                  accessibilityLabel="時刻を決定"
                >
                  <Text style={styles.confirmText}>決定</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: 'transparent', borderColor: separatorColor, borderWidth: StyleSheet.hairlineWidth }]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="時刻選択を閉じる"
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
  timeCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: 16,
  },
  pickerColumn: {
    flex: 1,
    height: 200,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 75,
  },
  pickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  pickerItemText: {
    fontSize: 20,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    fontSize: 24,
  },
  pickerIndicator: {
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    height: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    pointerEvents: 'none',
  },
  separator: {
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: 8,
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
  nowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nowText: {
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



