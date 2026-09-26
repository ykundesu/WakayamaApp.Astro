export type ChangelogEntry = {
  version: string;
  date: string;
  highlights?: string[];
  changes: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-09-26',
    changes: [
      'フレームワークをReactNativeからAstroにリワークし、読み込み速度を高速化',
    ],
  },
  {
    version: '1.1.3',
    date: '2026-06-21',
    changes: [
      'Firefoxで情報を表示できない問題を修正',
    ],
  },
  {
    version: '1.1.2',
    date: '2026-05-12',
    changes: [
      '寮食データの更新が反映されない問題を修正',
    ],
  },
  {
    version: '1.1.1',
    date: '2026-04-17',
    changes: [
      '行事のデータが存在しない場合の表記を追加',
      '予定と寮食にて注釈とデータ参照元の表記を追加',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-01-31',
    highlights: [
      '寮の行事の情報を見れるようになりました',
    ],
    changes: [
      '寮の行事の情報を閲覧できる機能を追加',
      '設定画面から変更履歴を確認できる機能を追加',
      '規則の情報が自動で更新されるように変更',
    ],
  },
];
