# WakayamaApp.Astro

和歌山高専 非公式アプリの静的Web/PWA版。Astroで画面のHTMLを事前生成し、授業・寮食・行事・学則はブラウザから既存APIで取得します。従来の画面と操作を引き継ぎ、Web版を独立して管理するリポジトリです。

## 開発・ビルド

Node.js 24 LTSを使用します。

```sh
npm ci
npm run dev
npm run export
npm run preview
```

`export` は `build` の別名です。出力先は `dist/`。通常のビルドでPythonや元のExpoプロジェクトは必要ありません。APIデータはビルド中には取得しないため、**データの更新にサイトの再ビルドは不要**です。

| ビルド時の環境変数 | 既定値 |
| --- | --- |
| `PUBLIC_API_BASE_URL` | `https://wakosen-app-api.yoking.dev/v1` |
| `PUBLIC_SITE_URL` | `https://wakosen-app.yoking.dev` |

APIの公開JSON・CORS設定をそのまま利用します。秘密鍵や認証トークンを `PUBLIC_*` に設定しないでください。

## 構成と操作

- 既存のReact Native Web部品をAstroビルド時にHTMLへ描画します。ExpoランタイムとExpo Routerは配信しません。
- JavaScriptは最初の描画後に読み込み、画面単位で分割します。タブ移動は全体を再読み込みせず、選択日や画面状態を保持します。
- 設定と個人予定は、従来と同じlocalStorageキーを使用します。同じ公開オリジンで移行すれば引き継げます。別ドメインのプレビューには自動では移りません。
- 寮食の日付がない場合・週APIが404の場合、選択日のメニュー領域に404と再読み込みを表示します。日付選択と食事タブは操作できます。食事の種類だけが空の場合は通常の空表示です。
- OGPは各固定ページのHTMLに含めます。学則詳細は共通OGPです。API更新だけで個別学則のOGPを変えることはできません。

## キャッシュ

| 対象 | 方針 |
| --- | --- |
| HTML / manifest / OGP / アイコン | HTTP再検証（`max-age=0, must-revalidate`） |
| `/_astro/` のハッシュ付きJS/CSS | 1年・immutable |
| API JSON | 保存済みデータを即表示し、画面を開くたびに `no-cache` で再検証。通信失敗時は保存済みデータを利用 |
| 寮食APIの404 | 該当週の保存データを破棄し、選択日の領域に404を表示 |
| 学則の図版 | 本文中で遅延読み込み。API側のHTTPキャッシュに従う |
| PWA | 初回loadの5秒後にSW登録。画面HTMLと分割JSを保存し、オフライン再起動・画面移動を可能にする |

PWAの登録先は従来と同じ `/expo-service-worker.js` です。ビルド内容からバージョンを生成し、更新後は旧アプリキャッシュを削除します。APIはSWで保存せず、画面側のデータ層で管理します。未取得のAPIデータと図版はオフラインでは表示できません。設定の「キャッシュ削除」はAPIデータを対象とし、個人予定と設定は残します。

## Cloudflare Pages

既存と同じGit連携→ビルド→静的配信のサイクルで運用できます。

1. このリポジトリをPagesに接続（独立リポジトリなのでルートディレクトリは空欄）。
2. Node.js 24、ビルドコマンド `npm run export`、出力ディレクトリ `dist` を設定。
3. 必要に応じて上記環境変数を設定し、プレビューで確認。
4. 本番にする際に既存カスタムドメインを新しいPagesプロジェクトへ接続。

`public/_headers` と `_redirects` が出力へコピーされます。学則の `/school-rules/:ruleId` は共通の静的詳細HTMLへ **200 rewrite** します。これによりビルド後の新規IDもAPIだけで追加できます。Cloudflare Functions/SSRは不要です。他の静的ホストでは同等のrewriteとHTTPヘッダーを設定してください。`astro preview` 自体はPagesのrewriteを再現しないため、動的IDを含む確認には `node scripts/serve.mjs` を使用できます。

切り戻しはカスタムドメインを元のPagesプロジェクトへ戻します。ブラウザに残るSWの更新確認も必要です。本リポジトリの作成・pushだけでは既存の本番配信先は変更されません。

## 検証

```sh
npm run check
npm test
npm run build
python -m pip install playwright
python -m playwright install chromium
npm run test:browser
```

ブラウザテストは4347/3001番ポートを使用します。寮食404、キャッシュ破棄と復旧、タブ状態保持、API再検証、個人予定保存、テーマ、ビルド後の学則追加、OGP、PWAオフラインを確認します。結果はGit管理外の `test-results/` に出力します。GitHub Actionsでも同じ検証を行います。

性能の測定条件・結果とアセット調査は [PERFORMANCE.md](PERFORMANCE.md) を参照してください。0.5秒は初期表示の目標であり、回線・端末・API応答を含めた保証値ではありません。

## アセットの保守

通常ビルドには生成済みアセットを使用します。アイコンを追加するときは `src/platform/icon-glyphs.json` に対応コードポイントを追加し、`pip install fonttools brotli` 後に `python scripts/subset-icons.py` で再生成します。PWAアイコンは `node scripts/optimize-icons.mjs` で生成できます。元フォントは `assets/` にあり、サイトには配信しません。

## ライセンス

アプリコードはMIT。詳細は [LICENSE](LICENSE)、フォントなどの第三者素材は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。取得する学校資料・APIデータは本リポジトリのMITライセンスの対象ではありません。
