import { StyleSheet, ScrollView, View, Animated, PanResponder, GestureResponderEvent, PanResponderGestureState, RefreshControl, useWindowDimensions, Platform } from 'react-native';
import { Stack } from 'expo-router';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTabTransition } from '@/hooks/useTabTransition';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, IconSize } from '@/constants/Design';
import { Card } from '@/components/ui/Card';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings, StudentClass } from '@/contexts/SettingsContext';
import { useSchedules } from '@/contexts/ScheduleContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Icon from '@/components/ui/AppIcon';
import { SourceNotice } from '@/components/ui/SourceNotice';
import { useClassesData } from '@/hooks/useClassesData';
import { SettingsModal } from '@/components/classes/SettingsModal';
import { ClassesSkeleton } from '@/components/classes/ClassesSkeleton';
import { WEEKDAY_LABELS, SEMESTER_LABELS, ClassItem } from '@/types/classes';
import { ScheduleList, ScheduleListItem } from '@/components/schedule/ScheduleList';
import { ScheduleFormModal } from '@/components/schedule/ScheduleFormModal';
import { DeleteConfirmModal } from '@/components/schedule/DeleteConfirmModal';
import { ScheduleFormValues } from '@/types/schedule';
import { computeDefaultSemester, computeDefaultDayOfWeek, getFiscalYear, formatTimestamp } from '@/utils/classesUtils';

const OFFICIAL_CLASSES_URL = 'https://www.wakayama-nct.ac.jp/campuslife/education/program/';

/**
 * 授業時間割画面コンポーネント
 * 
 * この画面では、学生の授業時間割を表示します。
 * 
 * 主な機能:
 * - 曜日ごとの授業一覧表示
 * - 左右スワイプによる曜日切り替え
 * - プルリフレッシュによるデータ更新
 * - オフライン時のキャッシュデータ表示
 * - 年度/学年/クラス/学期/曜日の設定変更
 * - ダークモード対応
 * - レスポンシブデザイン（Web対応）
 * 
 * @returns 授業時間割画面
 */
export default function HomeScreen() {
  // === アニメーションとレイアウト ===
  
  /** タブ遷移時のアニメーションスタイル */
  const animatedStyle = useTabTransition();
  
  /** ウィンドウサイズ取得（レスポンシブ対応用） */
  const { width } = useWindowDimensions();
  
  /** Wide Web表示かどうか（1100px以上） */
  const isWideWeb = Platform.OS === 'web' && width >= 1100;

  // === スワイプアニメーション用の状態 ===
  
  /** コンテンツの透明度（スワイプ時のフェード効果用） */
  const contentOpacity = useSharedValue(1);
  
  /** コンテンツの横移動量（スワイプ時のスライド効果用） */
  const contentTranslateX = useSharedValue(0);

  /** スワイプアニメーションスタイル */
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  /**
   * 曜日切り替え後のアニメーション実行
   * 
   * スワイプ後に素早いフェード＆スライドアニメーションを実行します。
   * 体感的な遅延を最小限にするため、短い時間で完了します。
   * 
   * @param direction - アニメーションの方向（'left'または'right'）
   */
  const animateAfterUpdate = useCallback((direction: 'left' | 'right' = 'left') => {
    const slideDistance = direction === 'left' ? 20 : -20;
    
    // 初期状態を設定（少し暗く、オフセット位置に）
    contentOpacity.value = 0.9;
    contentTranslateX.value = slideDistance;
    
    // 元の位置にアニメーション
    contentOpacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
    contentTranslateX.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
  }, [contentOpacity, contentTranslateX]);

  // === 設定とグローバルコンテキスト ===
  
  /** アプリ全体の設定を取得 */
  const { grade, studentClass, admissionYear, setStudentClass, setAdmissionYear, isLoading: settingsLoading } = useSettings();
  const {
    schedules,
    isLoading: schedulesLoading,
    addSchedule,
    updateSchedule,
    removeSchedule,
    getSchedulesForContext,
  } = useSchedules();

  // === 画面の状態管理 ===
  
  /** 選択中の学年（1〜5） */
  const [selectedGrade, setSelectedGrade] = useState(grade ?? 1);
  
  /** 選択中のクラス */
  const [selectedClass, setSelectedClass] = useState<StudentClass>((studentClass ?? 'B') as StudentClass);
  
  /** 選択中の学期（デフォルトは現在の日付から判定） */
  const [selectedSemester, setSelectedSemester] = useState<'0' | '1'>(() => computeDefaultSemester());
  
  /** 選択中の曜日（0=月, 4=金、デフォルトは現在の日付から判定） */
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(() => computeDefaultDayOfWeek());
  
  /** 設定モーダルの表示状態 */
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  /** 選択中の年度（nullの場合は現在の年度を使用） */
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);
  
  /** 選択中の入学年度（nullの場合は学年から計算） */
  const [selectedAdmissionYear, setSelectedAdmissionYear] = useState<number | null>(admissionYear ?? null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleFormValues, setScheduleFormValues] = useState<ScheduleFormValues | undefined>(undefined);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // === モーダル内の一時的な状態（適用ボタンを押すまで確定しない） ===
  
  /** 一時的な年度設定 */
  const [tempYear, setTempYear] = useState<number | null>(null);
  
  /** 一時的な学年設定 */
  const [tempGrade, setTempGrade] = useState<number>(selectedGrade);
  
  /** 一時的なクラス設定 */
  const [tempClass, setTempClass] = useState<StudentClass>(selectedClass as StudentClass);
  
  /** 一時的な学期設定 */
  const [tempSemester, setTempSemester] = useState<'0' | '1'>('0');
  
  /** 一時的な曜日設定 */
  const [tempDayOfWeek, setTempDayOfWeek] = useState(0);

  // === アニメーション用のRef ===
  
  /** フェードインアニメーション用の値 */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  /** モーダルスライドアニメーション用の値（0=非表示, 1=表示） */
  const modalSlide = useRef(new Animated.Value(0)).current;

  // === テーマカラーの取得 ===
  
  /** 背景色 */
  const backgroundColor = useThemeColor({}, 'background');
  
  /** カードの背景色 */
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  
  /** テキストの色 */
  const textColor = useThemeColor({}, 'text');
  
  /** ボーダーの色 */
  const borderColor = useThemeColor({ light: Colors.light.border, dark: Colors.dark.border }, 'text');
  
  /** カラースキーム（light/dark） */
  const colorScheme = useColorScheme() ?? 'light';

  // === データ取得（カスタムフック） ===
  
  /**
   * 授業データを取得するカスタムフックを使用
   * 
   * データ取得、キャッシュ管理、エラーハンドリングを
   * すべてフックに委譲しています。
   */
  const {
    loading,        // データ取得中かどうか
    error,          // エラーメッセージ
    allData,        // 全曜日の授業データ
    isCache,        // キャッシュデータかどうか
    lastUpdatedAt,  // 最終更新時刻
    refreshing,     // プルリフレッシュ中かどうか
    loadClasses,    // データ取得関数
    refetch,        // 再取得関数
    params,         // 計算されたパラメータ
  } = useClassesData({
    selectedGrade,
    selectedClass,
    selectedSemester,
    selectedFiscalYear,
    selectedAdmissionYear,
    admissionYear,
  });

  // === 曜日切り替え処理 ===
  
  /**
   * 連打防止用のタイムスタンプ
   * 
   * 短時間に何度もタップされると重いステート更新が積み上がるため、
   * スロットルを実装しています。
   */
  const lastPressRef = useRef<number>(0);
  
  /**
   * 曜日を変更する関数
   * 
   * 左右の矢印ボタンやスワイプで曜日を変更します。
   * 月→火→水→木→金→月... と循環します。
   * 
   * @param offset - 変更する曜日の差分（-1で前の曜日、+1で次の曜日）
   */
  const changeDayOfWeek = useCallback((offset: number) => {
    const now = Date.now();

    // 120ms以内の連打はスキップ（体感的なキビキビ感を維持）
    if (now - lastPressRef.current < 120) {
      return;
    }
    lastPressRef.current = now;

    // アニメーションの方向を決定
    const direction = offset > 0 ? 'left' : 'right';
    
    // 曜日を更新（0〜4の範囲でラップアラウンド）
    setSelectedDayOfWeek(prev => {
      const newDay = prev + offset;
      const wrapped = newDay < 0 ? 4 : (newDay > 4 ? 0 : newDay);
      return wrapped;
    });

    // アニメーションを実行
    animateAfterUpdate(direction);
  }, [animateAfterUpdate]);

  const closeScheduleModal = useCallback(() => {
    setScheduleModalVisible(false);
    setScheduleFormValues(undefined);
  }, []);

  const openAddSchedule = useCallback(() => {
    setScheduleFormValues(undefined);
    setScheduleModalVisible(true);
  }, []);

  const handleEditSchedule = useCallback((id: string) => {
    const entry = schedules.find(item => item.id === id);
    if (!entry) {
      return;
    }
    setScheduleFormValues({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      recurrence: entry.recurrence,
      startTime: entry.startTime,
      endTime: entry.endTime,
      dayOfWeek: typeof entry.dayOfWeek === 'number' ? entry.dayOfWeek : selectedDayOfWeek,
      oneTimeDate: entry.oneTimeDate,
      effectiveFrom: entry.effectiveFrom,
      effectiveTo: entry.effectiveTo,
      targetFiscalYear: entry.targetFiscalYear,
      notes: entry.notes,
    });
    setScheduleModalVisible(true);
  }, [schedules, selectedDayOfWeek]);

  const handleDeleteSchedule = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const handleSubmitSchedule = useCallback(async (values: ScheduleFormValues) => {
    setSavingSchedule(true);
    try {
      if (values.id) {
        await updateSchedule(values.id, values);
      } else {
        await addSchedule({
          ...values,
          dayOfWeek: typeof values.dayOfWeek === 'number' ? values.dayOfWeek : selectedDayOfWeek,
        });
      }
      setScheduleModalVisible(false);
      setScheduleFormValues(undefined);
    } catch (error) {
      console.error('カスタム予定の保存に失敗しました:', error);
    } finally {
      setSavingSchedule(false);
    }
  }, [addSchedule, selectedDayOfWeek, updateSchedule]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) {
      return;
    }
    try {
      await removeSchedule(pendingDeleteId);
    } catch (error) {
      console.error('カスタム予定の削除に失敗しました:', error);
    } finally {
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, removeSchedule]);

  // === 設定の同期（外部変更の反映） ===
  
  /**
   * グローバル設定のクラスが変更された場合に同期
   * 
   * 設定画面で変更された値をこの画面に反映します。
   */
  useEffect(() => {
    if (studentClass && studentClass !== selectedClass) {
      setSelectedClass(studentClass);
    }
  }, [studentClass, selectedClass]);
  
  /**
   * グローバル設定の入学年度が変更された場合に同期
   */
  useEffect(() => {
    if (admissionYear !== undefined && admissionYear !== selectedAdmissionYear) {
      setSelectedAdmissionYear(admissionYear ?? null);
    }
  }, [admissionYear, selectedAdmissionYear]);

  // === 初回データ取得 ===
  
  /**
   * コンポーネントマウント時、または設定変更時にデータを取得
   */
  useEffect(() => {
    loadClasses(true);
  }, [loadClasses]);

  // === 表示データの計算 ===
  
  /**
   * 現在選択中の曜日の授業データをメモ化
   * 
   * allDataから選択中の曜日のデータのみを抽出します。
   * 依存配列の変更時のみ再計算されます。
   */
  const currentClasses = useMemo(() => {
    if (allData.length === 0) return [] as ClassItem[];
    const dayData = allData.find(d => d.day === selectedDayOfWeek);
    return (dayData?.classes ?? []) as ClassItem[];
  }, [allData, selectedDayOfWeek]);

  /**
   * 表示データが読み込まれたらフェードインアニメーションを実行
   */
  // === 表示用の年度・学年の計算 ===

  /** 表示する年度（選択がなければ現在の年度） */
  const displayedFiscalYear = selectedFiscalYear ?? getFiscalYear();

  /** 表示する入学年度 */
  const displayedAdmissionYear = selectedAdmissionYear ?? admissionYear ?? (displayedFiscalYear - (selectedGrade - 1));

  /** 実際に表示する学年（年度と入学年度から計算） */
  const displayedGrade = Math.max(1, Math.min(5, displayedFiscalYear - displayedAdmissionYear + 1));

  const customInstances = useMemo(
    () =>
      getSchedulesForContext({
        fiscalYear: displayedFiscalYear,
        semester: selectedSemester,
        dayOfWeek: selectedDayOfWeek,
      }),
    [displayedFiscalYear, getSchedulesForContext, selectedDayOfWeek, selectedSemester],
  );

  const customScheduleItems = useMemo<ScheduleListItem[]>(
    () =>
      customInstances
        .map(instance => {
          const entry = schedules.find(item => item.id === instance.entryId);
          if (!entry) {
            return null;
          }
          return {
            type: 'custom' as const,
            id: entry.id,
            startTime: instance.startTime,
            endTime: instance.endTime,
            resolved: instance,
          };
        })
        .filter((item): item is Extract<ScheduleListItem, { type: 'custom' }> => item !== null),
    [customInstances, schedules],
  );

  const classScheduleItems = useMemo<ScheduleListItem[]>(
    () =>
      currentClasses.map((item, index) => ({
        type: 'class' as const,
        id: `class-${selectedDayOfWeek}-${index}`,
        startTime: item.start,
        endTime: item.end,
        classItem: item,
        periodIndex: index,
      })),
    [currentClasses, selectedDayOfWeek],
  );

  const combinedScheduleItems = useMemo<ScheduleListItem[]>(() => {
    const merged = [...classScheduleItems, ...customScheduleItems];
    merged.sort((a, b) => {
      if (a.startTime === b.startTime) {
        return a.endTime.localeCompare(b.endTime);
      }
      return a.startTime.localeCompare(b.startTime);
    });
    return merged;
  }, [classScheduleItems, customScheduleItems]);

  useEffect(() => {
    if (combinedScheduleItems.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [combinedScheduleItems, fadeAnim]);

  // === モーダル操作関数 ===
  
  /**
   * 設定モーダルを開く
   * 
   * 現在の設定値を一時的な状態にコピーして、モーダルを表示します。
   */
  const openSettingsModal = () => {
    setTempYear(selectedFiscalYear);
    setTempGrade(displayedGrade);
    setTempClass(selectedClass);
    setTempSemester(selectedSemester);
    setTempDayOfWeek(selectedDayOfWeek);
    setShowSettingsModal(true);
  };

  /**
   * 設定を適用する
   * 
   * モーダル内の一時的な設定を実際の設定に反映し、
   * グローバル設定も更新します。
   */
  const applySettings = () => {
    // 年度を設定
    setSelectedFiscalYear(tempYear);
    
    // 学年から入学年度を逆算
    const fiscal = tempYear ?? getFiscalYear();
    const computedAdmissionYear = fiscal - (tempGrade - 1);
    
    // 入学年度を設定（ローカルとグローバル両方）
    setSelectedAdmissionYear(computedAdmissionYear);
    setAdmissionYear(computedAdmissionYear);
    
    // その他の設定を反映
    setSelectedGrade(tempGrade);
    setSelectedClass(tempClass);
    setStudentClass(tempClass);
    setSelectedSemester(tempSemester);
    setSelectedDayOfWeek(tempDayOfWeek);
    
    // モーダルを閉じる
    closeSettingsModal();
  };

  /**
   * モーダルを閉じる
   * 
   * スライドアウトアニメーション後にモーダルを非表示にします。
   */
  const closeSettingsModal = () => {
    Animated.timing(modalSlide, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowSettingsModal(false));
  };

  /**
   * モーダルの表示状態に応じてアニメーションを実行
   */
  useEffect(() => {
    if (showSettingsModal) {
      // モーダルを開く: スライドインアニメーション
      modalSlide.setValue(0);
      Animated.timing(modalSlide, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      // モーダルを閉じる: 初期化
      modalSlide.setValue(0);
    }
  }, [showSettingsModal, modalSlide]);

  // === スワイプジェスチャーの設定 ===
  
  /**
   * 左右スワイプで曜日を変更
   * 
   * 横方向のスワイプを検知して、曜日の切り替えを行います。
   * - 左スワイプ: 次の曜日へ
   * - 右スワイプ: 前の曜日へ
   */
  const HORIZONTAL_ACTIVATION_PX = 15;
  const HORIZONTAL_RELEASE_PX = 50;
  const VERTICAL_TOLERANCE_PX = 20;

  const panResponder = useMemo(() => PanResponder.create({
    /**
     * スワイプを開始するかどうかを判定
     * 
     * 横方向のスワイプのみを検知し、縦スクロールは無視します。
     */
    onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      const absDx = Math.abs(gestureState.dx);
      const absDy = Math.abs(gestureState.dy);
      // 横方向の移動が最小閾値に達していない場合は無視
      if (absDx < HORIZONTAL_ACTIVATION_PX) {
        return false;
      }
      // 縦方向の移動が大きすぎる場合は縦スクロールとみなす
      if (absDy > absDx * 0.5) {
        return false;
      }
      return true;
    },
    
    /**
     * スワイプ終了時の処理
     * 
     * スワイプの方向と距離に応じて曜日を変更します。
     */
    onPanResponderRelease: (evt, gestureState) => {
      const absDx = Math.abs(gestureState.dx);
      const absDy = Math.abs(gestureState.dy);
      
      // 縦方向の移動が大きすぎる、または横方向の移動が不十分な場合は無視
      if (absDy > VERTICAL_TOLERANCE_PX || absDx < HORIZONTAL_RELEASE_PX) {
        return;
      }

      if (gestureState.dx < -HORIZONTAL_RELEASE_PX) {
        // 左スワイプ: 次の曜日へ
        changeDayOfWeek(1);
      } else if (gestureState.dx > HORIZONTAL_RELEASE_PX) {
        // 右スワイプ: 前の曜日へ
        changeDayOfWeek(-1);
      }
    },
  }), [changeDayOfWeek]);

  // === レンダリング ===
  
  // 設定読み込み中はスケルトンUIを表示
  if (settingsLoading) {
    return (
      <AnimatedReanimated.View style={[{ flex: 1 }, animatedStyle]}>
        <Stack.Screen options={{ title: '予定' }} />
        <ClassesSkeleton />
      </AnimatedReanimated.View>
    );
  }
  
  return (
    <AnimatedReanimated.View style={[{ flex: 1 }, animatedStyle]}>
      {/* ナビゲーションバーのタイトル設定 */}
      <Stack.Screen options={{ title: '予定' }} />
      
      {/* メインスクロールビュー（プルリフレッシュ対応、スワイプ対応） */}
      <ScrollView
        style={{ backgroundColor }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
        {...panResponder.panHandlers}
      >
      <ThemedView style={[styles.container, isWideWeb && styles.containerWide, { backgroundColor }]}>
        {/* ローディング状態（キャッシュがない場合） */}
        {loading && !isCache ? (
          <View style={[styles.centered]}>
            <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
              <Icon name="progress-clock" size={48} color={Colors[colorScheme].accent} style={{ marginBottom: 16 }} />
              <ThemedText style={[styles.loadingText, { color: textColor }]}>授業データを読み込み中...</ThemedText>
            </Animated.View>
          </View>
        ) : error && !isCache ? (
          /* エラー状態（キャッシュがない場合） */
          <View style={[styles.centered]}>
            <Icon name="alert-circle-outline" size={48} color={Colors[colorScheme].error} style={{ marginBottom: 12 }} />
            <ThemedText style={[styles.errorText, { color: textColor }]}>エラー: {error}</ThemedText>
            <View style={{ height: 16 }} />
            <DragSafeTouchableOpacity
              onPress={refetch}
              style={[styles.retryButtonStandalone, { borderColor: Colors[colorScheme].accent }]}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="再試行"
              accessibilityHint="データの取得をもう一度試します"
            >
              <Icon name="refresh" size={20} color={Colors[colorScheme].accent} style={{ marginRight: 8 }} accessibilityElementsHidden={true} />
              <ThemedText style={[styles.retryButtonText, { color: Colors[colorScheme].accent }]}>再試行</ThemedText>
            </DragSafeTouchableOpacity>
          </View>
        ) : (
        /* 通常表示 */
        <>
        {/* キャッシュバナー（オフライン時） */}
        {isCache && (
          <Card elevation="sm" style={[styles.cacheBanner, { backgroundColor: Colors[colorScheme].error }]} accessibilityElementsHidden={true}>
            <Icon name="cloud-off-outline" size={IconSize.sm} color="#fff" style={{ marginRight: Spacing.xs }} accessibilityElementsHidden={true} />
            <View style={{ flex: 1 }}>
              <ThemedText type="small" style={[styles.bannerTitle, { color: '#fff', fontWeight: 'bold' }]}>
                ネットに接続できません
              </ThemedText>
              <ThemedText type="caption" style={[styles.bannerSubtitle, { color: '#fff', opacity: 0.9 }]}>
                前回の保存データを表示中（{lastUpdatedAt ? formatTimestamp(lastUpdatedAt) : '不明'}）
              </ThemedText>
            </View>
            <DragSafeTouchableOpacity
              onPress={refetch}
              style={styles.bannerRetryBtn}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="再接続"
              accessibilityHint="ネットワークを再度確認してデータを更新します"
            >
              <Icon name="refresh" size={IconSize.sm} color="#fff" accessibilityElementsHidden={true} />
            </DragSafeTouchableOpacity>
          </Card>
        )}
        
        {/* 日付カード（年度・学年・クラス・学期・曜日を表示） */}
        <Card elevation="md" style={[styles.dateCard]}>
          {/* 前の曜日へ移動ボタン */}
          <DragSafeTouchableOpacity
            onPress={() => changeDayOfWeek(-1)}
            style={styles.dateNavBtn}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="前の曜日"
            accessibilityHint="月曜から前の曜日に移動します"
          >
            <Icon name="chevron-left" size={IconSize.md} color={Colors[colorScheme].accent} accessibilityElementsHidden={true} />
          </DragSafeTouchableOpacity>
          
          {/* 中央の日付表示エリア（タップで設定モーダル表示） */}
          <DragSafeTouchableOpacity 
            onPress={openSettingsModal} 
            style={{ flex: 1 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${displayedFiscalYear}年度 ${displayedGrade}${selectedClass} ${SEMESTER_LABELS[selectedSemester]} ${WEEKDAY_LABELS[selectedDayOfWeek]}`}
            accessibilityHint="年度、学年、クラス、学期、曜日を変更します"
          >
            <View style={styles.dateTextContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ThemedText type="caption" style={[styles.dateTextSmall, { color: textColor }]}>
                  {displayedFiscalYear}年度
                </ThemedText>
                {/* キャッシュバッジ */}
                {isCache && (
                  <View style={[styles.cacheBadge, { backgroundColor: Colors[colorScheme].error, marginLeft: Spacing.xs }]} accessibilityElementsHidden={true}>
                    <ThemedText type="caption" style={styles.cacheBadgeText}>キャッシュ</ThemedText>
                  </View>
                )}
              </View>
              {/* メインの日付テキスト */}
              <ThemedText type="title" style={[styles.dateText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit={true} minimumFontScale={0.7}> 
                {displayedGrade}{selectedClass} {SEMESTER_LABELS[selectedSemester]}{"\u00A0"}{WEEKDAY_LABELS[selectedDayOfWeek]}
              </ThemedText>
            </View>
          </DragSafeTouchableOpacity>
          
          {/* 次の曜日へ移動ボタン */}
          <DragSafeTouchableOpacity
            onPress={() => changeDayOfWeek(1)}
            style={styles.dateNavBtn}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="次の曜日"
            accessibilityHint="金曜の次の曜日に移動します"
          >
            <Icon name="chevron-right" size={IconSize.md} color={Colors[colorScheme].accent} accessibilityElementsHidden={true} />
          </DragSafeTouchableOpacity>
        </Card>
        
        {/* 授業リストまたは空状態（アニメーション付き） */}
        <Animated.View style={[
          { opacity: fadeAnim },
          animatedContentStyle
        ]}>
        <ScheduleList
          items={combinedScheduleItems}
          colorScheme={colorScheme}
          textColor={textColor}
          borderColor={borderColor}
          loadingCustom={schedulesLoading}
          onAdd={openAddSchedule}
          onEdit={handleEditSchedule}
          onDelete={handleDeleteSchedule}
        />
        </Animated.View>
        <SourceNotice sourceUrl={OFFICIAL_CLASSES_URL} style={styles.sourceNotice} />
        </>
        )}
      </ThemedView>
      </ScrollView>
      
      {/* 設定モーダル */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={closeSettingsModal}
        onApply={applySettings}
        tempYear={tempYear}
        setTempYear={setTempYear}
        tempGrade={tempGrade}
        setTempGrade={setTempGrade}
        tempClass={tempClass}
        setTempClass={setTempClass}
        tempSemester={tempSemester}
        setTempSemester={setTempSemester}
        tempDayOfWeek={tempDayOfWeek}
        setTempDayOfWeek={setTempDayOfWeek}
        modalSlide={modalSlide}
        cardBackground={cardBackground}
        textColor={textColor}
        borderColor={borderColor}
      backgroundColor={backgroundColor}
      colorScheme={colorScheme}
    />

      <ScheduleFormModal
        visible={scheduleModalVisible}
        onClose={closeScheduleModal}
        onSubmit={handleSubmitSchedule}
        initialValues={scheduleFormValues}
        defaultDayOfWeek={selectedDayOfWeek}
        defaultFiscalYear={displayedFiscalYear}
        colorScheme={colorScheme}
        cardBackground={cardBackground}
        textColor={textColor}
        accentColor={Colors[colorScheme].accent}
        saving={savingSchedule}
      />
      <DeleteConfirmModal
        visible={pendingDeleteId !== null}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
        textColor={textColor}
        colorScheme={colorScheme}
      />

      {/* 注: 初期設定モーダルはルートレイアウトで表示されるため、ここでは表示しない */}
    </AnimatedReanimated.View>
  );
}

/**
 * スタイル定義
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  containerWide: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  classList: {
    flexDirection: 'column',
  },
  classListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  dateNavBtn: {
    padding: Spacing.xs / 2,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.xs / 4,
    flexShrink: 0,
  },
  dateText: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
    minWidth: 0,
  },
  dateTextContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs / 2,
    paddingVertical: Spacing.xs / 2,
  },
  dateTextSmall: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs - 2,
    opacity: 0.75,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.8,
  },
  retryButtonStandalone: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  bannerTitle: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bannerSubtitle: {
    fontWeight: '500',
    marginTop: Spacing.xs / 4,
  },
  bannerRetryBtn: {
    padding: Spacing.sm - 2,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cacheBadge: {
    paddingVertical: Spacing.xs - 3,
    paddingHorizontal: Spacing.sm - 2,
    borderRadius: Radius.sm + 2,
  },
  cacheBadgeText: {
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sourceNotice: {
    marginBottom: Spacing.md,
  },
});
