import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ThemedText';
import Icon from '@/components/ui/AppIcon';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Design';
import { ClassItem, periodColors } from '@/types/classes';

/**
 * ClassCardコンポーネントのプロパティ
 */
interface ClassCardProps {
  /** 授業情報 */
  item: ClassItem;
  
  /** 授業の限（0始まり: 0=1限, 1=2限, ...） */
  index: number;
  
  /** カラースキーム（ライト/ダークモード） */
  colorScheme: 'light' | 'dark';
  
  /** テキストの色 */
  textColor: string;
  
  /** ボーダーの色 */
  borderColor: string;
}

/**
 * 個別の授業カードコンポーネント
 * 
 * 1つの授業（1コマ）を表示するカードです。
 * 限ごとに異なる色が割り当てられ、視認性が向上しています。
 * 
 * 表示内容:
 * - 限の番号（カラーバッジ）
 * - 授業名
 * - 授業時間（開始〜終了）
 * - 担当教員（設定されている場合）
 * 
 * @param props - コンポーネントのプロパティ
 * 
 * @example
 * ```tsx
 * <ClassCard
 *   item={{
 *     name: "数学",
 *     start: "09:00",
 *     end: "10:30",
 *     teacher: "山田太郎"
 *   }}
 *   index={0}
 *   colorScheme="light"
 *   textColor="#000000"
 *   borderColor="#CCCCCC"
 * />
 * ```
 */
const ClassCardBase = ({ item, index, colorScheme, textColor, borderColor }: ClassCardProps) => {
  // ダークモードかどうかを判定
  const isDark = colorScheme === 'dark';
  
  // この限に対応する色を取得（範囲外の場合は1限目の色を使用）
  const periodColor = periodColors[index] || periodColors[0];

  return (
    <Card
      elevation="md"
      style={[
        styles.item,
        // ダークモードの場合はボーダーを追加
        isDark && {
          borderWidth: 1,
          borderColor: borderColor,
        },
      ]}
      accessible={true}
      accessibilityLabel={`${index + 1}限 ${item.name}`}
      accessibilityHint={`時間: ${item.start}〜${item.end}${item.teacher ? `、講師: ${item.teacher}` : ''}`}
    >
      <View style={styles.row}>
        {/* 左側: 限の番号バッジ */}
        <View 
          style={[
            styles.itemLeft, 
            { 
              // ダークモードとライトモードで背景色を変更
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : periodColor.secondary,
              borderLeftWidth: 4,
              borderLeftColor: periodColor.primary, // アクセントカラーの縦線
              borderRadius: 16,
            }
          ]}
          accessibilityElementsHidden={true}
        >
          <View style={[styles.periodBadge, { 
            borderColor: periodColor.primary,
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
          }]}> 
            <ThemedText style={[styles.periodNumber, { color: periodColor.primary }]}>
              {index + 1} {/* 0始まりなので+1して表示（1限、2限...） */}
            </ThemedText>
          </View>
        </View>

        {/* 右側: 授業の詳細情報 */}
        <View style={styles.content} accessibilityElementsHidden={true}>
          {/* 授業名 */}
          <ThemedText style={[styles.subject, { color: textColor }]}>{item.name}</ThemedText>
          
          {/* 授業時間 */}
          <View style={styles.timeRow}>
            <Icon 
              name="clock-outline" 
              size={14} 
              color={isDark ? Colors[colorScheme].icon : periodColor.primary} 
              style={{ marginRight: 6 }}
              accessibilityElementsHidden={true}
            />
            <ThemedText style={[
              styles.timeText, 
              { 
                color: isDark ? textColor : periodColor.primary, 
                opacity: isDark ? 0.7 : 0.9 
              }
            ]}>
              {item.start} - {item.end}
            </ThemedText>
          </View>
          
          {/* 担当教員（設定されている場合のみ表示） */}
          {item.teacher && (
            <View style={styles.teacherRow}>
              <Icon 
                name="account-outline" 
                size={14} 
                color={Colors[colorScheme].icon} 
                style={{ marginRight: 6 }}
                accessibilityElementsHidden={true}
              />
              <ThemedText style={[styles.teacherText, { color: textColor, opacity: 0.6 }]}>
                {item.teacher}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

export const ClassCard = React.memo(ClassCardBase);

/**
 * スタイル定義
 */
const styles = StyleSheet.create({
  /** カード全体のスタイル */
  item: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: Spacing.md,
  },
  
  /** 左側の限番号表示エリア */
  itemLeft: {
    marginRight: Spacing.md,
    minWidth: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  
  /** 授業名のテキスト */
  subject: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: Spacing.xs / 4,
  },
  
  /** 時間のテキスト */
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  
  /** 時間表示の行 */
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs / 4,
    marginBottom: -Spacing.xs / 4,
  },
  
  /** 教員表示の行 */
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  
  /** 教員名のテキスト */
  teacherText: {
    fontSize: 13,
    fontWeight: '400',
  },
  
  /** カード内の水平レイアウト */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  /** 右側のコンテンツエリア */
  content: {
    flex: 1,
  },
  
  /** 限番号のバッジ（円形） */
  periodBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  /** 限番号のテキスト */
  periodNumber: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
    // 数字がやや左寄りに見えるのを防ぐため、
    // バッジ全体幅に合わせてテキストを中央寄せする
    width: '100%',
    textAlign: 'center',
    // Androidでの余白分を抑えて視覚的センターを合わせる
    includeFontPadding: false,
    paddingLeft: 6,
    paddingBottom: 1
  },
});
