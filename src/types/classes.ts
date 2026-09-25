/**
 * 授業の型定義と定数
 * 
 * このファイルには授業時間割表示に関連する
 * すべての型定義と定数が含まれています。
 */

/**
 * 個別の授業情報
 * 
 * 1コマの授業に関する情報を表します。
 */
export type ClassItem = { 
  /** 授業開始時刻（例: "09:00"） */
  start: string;
  
  /** 授業終了時刻（例: "10:30"） */
  end: string;
  
  /** 授業名（例: "数学"） */
  name: string;
  
  /** 担当教員名（設定されていない場合はnull） */
  teacher: string | null;
};

/**
 * 1日分の授業情報
 * 
 * 特定の曜日の全授業を含みます。
 */
export type DayClasses = { 
  /** 曜日インデックス（0=月, 1=火, 2=水, 3=木, 4=金） */
  day: number;
  
  /** その日の授業リスト（1限から順番に） */
  classes: ClassItem[];
};

/**
 * 授業の限ごとの色設定
 * 
 * UIでの視認性を高めるため、各限に専用の色を割り当てています。
 */
export type PeriodColor = {
  /** メインカラー（テキストやボーダーに使用） */
  primary: string;
  
  /** 背景色（カードの背景に使用） */
  secondary: string;
  
  /** グラデーション用の色配列（将来の拡張用） */
  gradient: [string, string];
  
  /** アイコン名（MaterialCommunityIcons） */
  icon: string;
};

/**
 * 各限の色設定
 * 
 * 1限から6限までの色を定義しています。
 * 各限に異なる色を割り当てることで、視覚的に区別しやすくなっています。
 */
export const periodColors: PeriodColor[] = [
  { 
    primary: '#FF6B6B',     // 赤系
    secondary: '#FFE5E5',   // 薄い赤
    gradient: ['#FF6B6B', '#FF8E8E'], 
    icon: 'numeric-1-circle' 
  },
  { 
    primary: '#4ECDC4',     // ティール系
    secondary: '#E8F8F7',   // 薄いティール
    gradient: ['#4ECDC4', '#6FE3DA'], 
    icon: 'numeric-2-circle' 
  },
  { 
    primary: '#45B7D1',     // 青系
    secondary: '#E8F4FD',   // 薄い青
    gradient: ['#45B7D1', '#66C8E6'], 
    icon: 'numeric-3-circle' 
  },
  { 
    primary: '#96CEB4',     // 緑系
    secondary: '#F0F9F4',   // 薄い緑
    gradient: ['#96CEB4', '#B2E0C9'], 
    icon: 'numeric-4-circle' 
  },
  { 
    primary: '#FECA57',     // オレンジ系
    secondary: '#FFF8E1',   // 薄いオレンジ
    gradient: ['#FECA57', '#FFD97D'], 
    icon: 'numeric-5-circle' 
  },
  { 
    primary: '#A29BFE',     // 紫系
    secondary: '#F1F0FF',   // 薄い紫
    gradient: ['#A29BFE', '#BEB8FF'], 
    icon: 'numeric-6-circle' 
  },
];

/**
 * 曜日ラベル
 * 
 * UIに表示する曜日の名前です。
 * インデックス順に月曜から金曜まで。
 */
export const WEEKDAY_LABELS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'] as const;

/**
 * 学期ラベル
 * 
 * APIとUIで使用する学期の対応表です。
 * - '0': 前期（4月〜8月）
 * - '1': 後期（9月〜3月）
 */
export const SEMESTER_LABELS: Record<'0' | '1', string> = { 
  '0': '前期', 
  '1': '後期' 
};
