import {useApiResource} from '@/data/api';
import {normalizeMeals,mondayKey} from '@/data/meals';
import React, { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { withAppName } from '@/constants/App';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { useTabTransition } from '@/hooks/useTabTransition';
import { View, StyleSheet, FlatList, PanResponder, GestureResponderEvent, PanResponderGestureState, Platform } from 'react-native';
import Icon from '@/components/ui/AppIcon';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, Radius, Shadow, IconSize } from '@/constants/Design';
import { MealsSkeleton } from '@/components/meals/MealsSkeleton';
import { SourceNotice } from '@/components/ui/SourceNotice';
import { useSettings } from '@/contexts/SettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import DateSelector from '@/components/DateSelector';
import { formatDate } from '@/components/DateSelector';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { apiUrl } from '@/constants/Api';
// データ取得用エンドポイント（週の最初の月曜日キーで取得）
const WEEK_URL = (mondayKey: string) => apiUrl(`/meals/${mondayKey}.json`);
const OFFICIAL_MEALS_URL = 'https://www.wakayama-nct.ac.jp/campuslife/dormitory/restaurant/';
const MEALS_FETCH_TIMEOUT_MS = 10000;

type EnsureWeekOptions = {
  forceRefresh?: boolean;
};
// JSON Schemaに合わせた型定義
interface Nutrition { 
  energyKcal: number | null; 
  proteinG: number | null; 
  fatG: number | null; 
  calciumMg: number | null; 
  saltG: number | null; 
}

interface Menu { 
  type: string; 
  mainType: string; 
  main: string; 
  subs: string[]; 
  nutrition?: Nutrition; 
}

interface DayMenu { 
  date: string; 
  breakfast: Menu[]; 
  lunch: Menu[]; 
  dinner: Menu[]; 
}
interface SchoolMenu { allMenus: DayMenu[]; }

// メニュー名に合わせたアイコンマップ
const iconMap: Record<string, keyof typeof Icon.glyphMap> = {
  'ライス': 'rice',
  'パン': 'bread-slice',
  'カレー': 'bowl-mix',
};
function getIconName(main: string, subs: string[]): keyof typeof Icon.glyphMap {
  // mainがundefinedまたはnullの場合は'food'を返す
  if (!main || typeof main !== 'string') {
    return 'food';
  }
  
  for (const key in iconMap) {
    if (main.includes(key)) return iconMap[key];
  }
  // mainTypeで見つからない場合、subsに「ライス」が含まれていればriceを返す
  if (subs && Array.isArray(subs)) {
    if (subs.some((sub) => sub && sub.includes('ライス'))) {
      return 'rice';
    }
    else if (subs.some((sub) => sub && sub.includes('パン'))) {
      return 'bread-slice';
    }
  }
  return 'food';
}

// ボタン色分け用マップ
const mealTypeColors = {
  breakfast: {
    active: '#FF8A65', // モダンオレンジ
    activeDark: '#E67A55', // ダークモード用の少し暗めのオレンジ
    inactive: '#FFF3E0',
    inactiveDark: 'rgba(255, 138, 101, 0.18)', // ダークモード用の薄いオレンジ
    textActive: '#fff',
    textInactive: '#FF8A65',
    textInactiveDark: '#FF8A65', // ダークモードでも同じオレンジ
  },
  lunch: {
    active: '#4CAF50', // モダングリーン
    activeDark: '#45A049', // ダークモード用の少し暗めの緑
    inactive: '#E8F5E9',
    inactiveDark: 'rgba(76, 175, 80, 0.18)', // ダークモード用の薄い緑
    textActive: '#fff',
    textInactive: '#4CAF50',
    textInactiveDark: '#4CAF50', // ダークモードでも同じ緑
  },
  dinner: {
    active: '#00BCD4', // モダンティール
    activeDark: '#00A8C0', // ダークモード用の少し暗めのシアン
    inactive: '#E0F2F1',
    inactiveDark: 'rgba(0, 188, 212, 0.18)', // ダークモード用の薄いシアン
    textActive: '#fff',
    textInactive: '#00BCD4',
    textInactiveDark: '#00BCD4', // ダークモードでも同じシアン
  },
};

export default function MealsScreen() {
  const animatedStyle = useTabTransition();
  const { isLoading: settingsLoading } = useSettings();
  const colorScheme = useColorScheme() ?? 'light';
  const [currentDate, setCurrentDate] = useState(new Date());
  const resource = useApiResource(WEEK_URL(mondayKey(currentDate)), normalizeMeals);
  const schoolMenu = resource.data;
  const loading = resource.loading;
  const error = resource.error;


  const [hasPrev, setHasPrev] = useState<boolean>(true);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const isWeekFetching = loading;
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({ light: Colors.light.accent, dark: Colors.dark.accent }, 'tint');
  const refreshedWeeksRef = useRef<Set<string>>(new Set());

  // アニメーション用の状態管理
  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  
  // ボタンアニメーション用
  const buttonScale = useSharedValue(1);
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // アニメーションスタイル
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  // インアニメのみ実行（即時に内容を切替後、フェード＋スライドイン）
  const animateContentInOnly = (direction: 'left' | 'right' = 'left') => {
    const slideDistance = direction === 'left' ? -14 : 14;
    // 新コンテンツを右(または左)から入れる準備
    contentOpacity.value = 0;
    contentTranslateX.value = -slideDistance; // 反対側から入る
    // フェードイン + スライドイン
    contentOpacity.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) });
    contentTranslateX.value = withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) });
  };

  // アニメーション実行関数
  const executeContentAnimation = (callback: () => void, direction: 'left' | 'right' = 'left') => {
    // アニメーション中でも新しい操作を受け付けるように変更
    const slideDistance = direction === 'left' ? -14 : 14;
    
    // 現在のアニメーションをキャンセルして新しいアニメーションを開始
    contentOpacity.value = withTiming(0, { duration: 60, easing: Easing.out(Easing.quad) });
    contentTranslateX.value = withTiming(slideDistance, { duration: 60, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(callback)();
      
      // 反対方向から戻す
      contentTranslateX.value = -slideDistance;
      
      // フェードイン + スライド戻し
      contentOpacity.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) });
      contentTranslateX.value = withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) });
    });
  };
  const ensureWeekForDate = async (_date: Date, options: EnsureWeekOptions = {}) => { if(options.forceRefresh) resource.refresh(); };
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    if (schoolMenu && !initialized) {
      const now = new Date();
      const todayKey = formatDate(now);
      // 時間帯によって初期mealTypeを決定
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay(); // 0:日, 6:土
      const isHoliday = (day === 0 || day === 6);
      let breakfastEnd = isHoliday ? 9 * 60 + 30 : 8 * 60 + 30; // 分単位
      let lunchEnd = 13 * 60;
      let dinnerEnd = 19 * 60 + 30;
      const currentMinutes = hour * 60 + minute;
      if (currentMinutes <= breakfastEnd) {
        setMealType('breakfast');
      } else if (currentMinutes <= lunchEnd) {
        setMealType('lunch');
      } else if (currentMinutes <= dinnerEnd) {
        setMealType('dinner');
      } else {
        setMealType('breakfast'); // 19:30以降は翌日の朝食扱い
      }
      setInitialized(true);
    }
  }, [schoolMenu, initialized]);

  // todayに該当するDayMenuをSchoolMenuから取得
  const dayKey = formatDate(currentDate);
  const currentDayMenu = schoolMenu?.allMenus.find((d) => d.date === dayKey) || { date: dayKey, breakfast: [], lunch: [], dinner: [] };
  const data = currentDayMenu[mealType];
  const notFound = !loading && !error && !schoolMenu?.allMenus.some(d=>d.date===dayKey);

  // デバッグログ
  if (__DEV__) {
    console.log('Debug info:', {
      dayKey,
      currentDate,
      schoolMenu: schoolMenu ? { allMenusLength: schoolMenu.allMenus.length, allMenus: schoolMenu.allMenus.map(d => ({ date: d.date, breakfast: d.breakfast.length, lunch: d.lunch.length, dinner: d.dinner.length })) } : null,
      currentDayMenu,
      mealType,
      dataLength: data.length
    });
  }

  const changeDate = (offset: number) => {
    const direction = offset > 0 ? 'left' : 'right';
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    // 即時切替
    setCurrentDate(d);
    void ensureWeekForDate(d);
    // 新しい内容をインアニメのみ
    animateContentInOnly(direction);
  };

  const changeMealType = (newMealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (newMealType === mealType) return;
    
    // ボタンアニメーション
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 60, easing: Easing.out(Easing.quad) })
    );
    
    const currentIndex = mealTypes.indexOf(mealType);
    const newIndex = mealTypes.indexOf(newMealType);
    const direction = newIndex > currentIndex ? 'left' : 'right';

    // ハイライトと内容を即時切替
    setMealType(newMealType);
    // 新しい内容をインアニメのみ
    animateContentInOnly(direction);
  };

  // アニメーション対応TouchableOpacity
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(DragSafeTouchableOpacity);



  // メモ化された関数
  const renderItem = ({ item }: { item: Menu }) => (
    <View 
      style={styles.listItem}
      accessible={true}
      accessibilityLabel={item.main}
      accessibilityHint={`${item.subs.length > 0 ? `副菜: ${item.subs.join(', ')}. ` : ''}${item.nutrition ? `エネルギー: ${item.nutrition.energyKcal ?? '-'} kcal` : ''}`}
    >
      <Icon name={getIconName(item.mainType, item.subs)} size={IconSize.md} color={tintColor} style={styles.menuIcon} accessibilityElementsHidden={true} />
      <View style={{ flex: 1 }}>
        <ThemedText type="defaultSemiBold" style={styles.listMain}>{item.main}</ThemedText>
        {item.subs.length > 0 && (
          <View style={styles.subsList} accessibilityElementsHidden={true}>
            {item.subs.map((sub, idx) => (
              <View key={idx} style={styles.subsListItem}>
                <ThemedText type="small" style={styles.bullet}>・</ThemedText>
                <ThemedText type="small" style={styles.listSubs}>{sub}</ThemedText>
              </View>
            ))}
          </View>
        )}
        {item.nutrition && (
          <View style={styles.nutritionBox} accessibilityElementsHidden={true}>
            <ThemedText type="caption" style={styles.nutritionSummary} numberOfLines={2}>
              エネルギー: {item.nutrition.energyKcal ?? '-'} kcal / タンパク質: {item.nutrition.proteinG ?? '-'} g{`\n`}脂質: {item.nutrition.fatG ?? '-'} g / カルシウム: {item.nutrition.calciumMg ?? '-'} mg / 食塩相当量: {item.nutrition.saltG ?? '-'} g
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  const keyExtractor = (item: Menu, index: number) => `${dayKey}-${mealType}-${index}`;

  // スワイプで食事タイプ・日付を切り替える
  const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
  const getMealTypeIndex = (type: typeof mealType) => mealTypes.indexOf(type);
  const changeMealTypeWithSwipe = (direction: 'left' | 'right') => {
    const idx = getMealTypeIndex(mealType);
    if (direction === 'left') {
      if (idx < mealTypes.length - 1) {
        changeMealType(mealTypes[idx + 1]);
      } else if (hasNext) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        // 即時切替
        setCurrentDate(d);
        setMealType('breakfast');
        void ensureWeekForDate(d);
        animateContentInOnly('left');
      }
    } else if (direction === 'right') {
      if (idx > 0) {
        changeMealType(mealTypes[idx - 1]);
      } else if (hasPrev) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        // 即時切替
        setCurrentDate(d);
        setMealType('dinner');
        void ensureWeekForDate(d);
        animateContentInOnly('right');
      }
    }
  };
  const HORIZONTAL_ACTIVATION_PX = 15;
  const HORIZONTAL_RELEASE_PX = 50;
  const VERTICAL_TOLERANCE_PX = 20;

  const panResponder = PanResponder.create({
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
    onPanResponderRelease: (evt, gestureState) => {
      const absDx = Math.abs(gestureState.dx);
      const absDy = Math.abs(gestureState.dy);
      
      // 縦方向の移動が大きすぎる、または横方向の移動が不十分な場合は無視
      if (absDy > VERTICAL_TOLERANCE_PX || absDx < HORIZONTAL_RELEASE_PX) {
        return;
      }
      
      if (gestureState.dx < -HORIZONTAL_RELEASE_PX) {
        changeMealTypeWithSwipe('left');
      } else if (gestureState.dx > HORIZONTAL_RELEASE_PX) {
        changeMealTypeWithSwipe('right');
      }
    },
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Stack.Screen options={{ title: '寮食' }} />
      <ThemedView style={[styles.container, { backgroundColor }]} {...panResponder.panHandlers}>
      <DateSelector
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        hasPrev={hasPrev}
        hasNext={hasNext}
        changeDate={changeDate}
       />

      <View style={styles.mealTypeContainer} accessibilityRole="tablist">
        {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
          <AnimatedTouchableOpacity
            key={type}
            style={[
              styles.mealTypeButton,
              { 
                backgroundColor: mealType === type 
                  ? (colorScheme === 'dark' ? mealTypeColors[type].activeDark : mealTypeColors[type].active)
                  : (colorScheme === 'dark' ? mealTypeColors[type].inactiveDark : mealTypeColors[type].inactive), 
                flex: 1,
                borderRadius: Radius.xl,
              },
              mealType === type && styles.mealTypeButtonActive,
              buttonAnimatedStyle,
            ]}
            onPressIn={() => changeMealType(type)}
            onPress={() => changeMealType(type)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel={type === 'breakfast' ? '朝食' : type === 'lunch' ? '昼食' : '夕食'}
            accessibilityState={{ selected: mealType === type }}
            accessibilityHint={type === 'breakfast' ? '朝食のメニューを表示します' : type === 'lunch' ? '昼食のメニューを表示します' : '夕食のメニューを表示します'}
          >
            <ThemedText
              type={mealType === type ? 'defaultSemiBold' : 'default'}
              style={{
                color: mealType === type 
                  ? mealTypeColors[type].textActive 
                  : (colorScheme === 'dark' ? mealTypeColors[type].textInactiveDark : mealTypeColors[type].textInactive),
                textAlign: 'center',
                fontWeight: mealType === type ? 'bold' : '500',
                fontSize: 16,
              }}
            >
              {type === 'breakfast' ? '朝食' : type === 'lunch' ? '昼食' : '夕食'}
            </ThemedText>
          </AnimatedTouchableOpacity>
        ))}
      </View>
      <Animated.View style={[{ flex: 1 }, contentAnimatedStyle]}>
        {isWeekFetching ? (
          <View style={[styles.centered, { flex: 1 }]}>
            <Icon name="progress-clock" size={32} color={tintColor} style={{ marginBottom: 8 }} />
            <ThemedText>読み込み中...</ThemedText>
          </View>
        ) : (
          <FlatList
            key={`${dayKey}-${mealType}`}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + insets.bottom + 16 }]}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
            style={{ flex: 1, backgroundColor }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedView style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Icon name="food-off" size={48} color={tintColor} style={{ marginBottom: 16, opacity: 0.5 }} accessibilityElementsHidden={true} />
                <ThemedText style={{ textAlign: 'center', opacity: 0.6, fontSize: 16 }}>
                  {notFound ? '404｜この日の寮食データはありません' : error || 'この日のメニュー情報がありません'}
                </ThemedText>
                <DragSafeTouchableOpacity
                  style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: tintColor, borderRadius: 8 }}
                  onPress={() => ensureWeekForDate(currentDate, { forceRefresh: true })}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="再読み込み"
                  accessibilityHint="メニュー情報を再度読み込みます"
                >
                  <ThemedText style={{ color: 'white', fontSize: 14 }}>再読み込み</ThemedText>
                </DragSafeTouchableOpacity>
              </ThemedView>
            }
            ListFooterComponent={<SourceNotice sourceUrl={OFFICIAL_MEALS_URL} />}
          />
        )}
      </Animated.View>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
  },
  errorText: {
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dateNavBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.xl,
  },
  disabledNavBtn: {
    opacity: 0.3,
  },
  dateText: {
    marginHorizontal: Spacing.md,
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md + 2,
    gap: Spacing.sm - 2,
  },
  mealTypeButton: {
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: 0,
    minWidth: 0,
    marginHorizontal: 0,
  },
  mealTypeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'transparent',
    gap: Spacing.xs / 2,
  },
  listMain: {
    fontSize: 17,
    marginLeft: Spacing.xs / 2,
    marginBottom: Spacing.xs / 4,
  },
  listSubs: {
    marginLeft: Spacing.xs,
  },
  menuIcon: {
    marginRight: Spacing.xs / 4,
  },
  subsList: {
    marginTop: Spacing.xs / 4,
    marginLeft: Spacing.sm,
  },
  subsListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    marginRight: Spacing.xs / 2,
  },
  nutritionBox: {
    marginTop: Spacing.xs + 2,
    marginLeft: Spacing.xs,
  },
  nutritionSummary: {
    lineHeight: 16,
  },
});
