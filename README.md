# WakayamaApp.Astro

和歌山高専 非公式アプリの静的Web/PWA版。Astroで画面を事前描画し、授業・寮食・行事・学則はブラウザから既存APIで取得します。

## 開発・ビルド

Node.js 24 LTSを使用します。

```sh
npm ci
npm run dev
npm run export
npm run preview
```

出力先は `dist/`。データの更新にWebサイトの再ビルドは必要ありません。
`PUBLIC_API_BASE_URL` と `PUBLIC_SITE_URL` でAPIと公開URLを指定できます。

既存の画面部品をReact Native WebからHTMLへ事前描画し、操作コードを画面ごとに分割しています。ExpoランタイムやExpo Routerは配信しません。Web設定と個人予定は既存AsyncStorageのキーを保持します。

## ライセンス

アプリコードはMIT。第三者の依存ライブラリとアイコンにはそれぞれのライセンスが適用されます。取得する学校資料・APIデータはこのリポジトリのMITライセンスの対象ではありません。
