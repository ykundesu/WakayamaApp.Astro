# 開発者向けドキュメント

WakayamaApp.Astro の開発・ビルド・デプロイ・テストの詳細です。アプリの概要は [README](../README.md) を参照してください。

## クイックスタート

Node.js 24 LTS が必要です。

```sh
npm ci
npm run dev        # http://127.0.0.1:4321
```

開発サーバーは本番APIからデータを取得するため、APIを用意する必要はありません。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動（`npm run web` も同じ） |
| `npm run build` | `dist/` に静的サイトを出力（`npm run export` も同じ） |
| `npm run preview` | ビルド結果を確認（学則詳細のrewriteは再現しない → [ローカル確認](#ローカルでビルド結果を確認する)） |
| `npm run check` | TypeScriptの型チェック |
| `npm run check:deploy` | ビルド済みの `dist/` を使ってWorkersデプロイをdry-run検証（アップロードなし） |
| `npm test` | Node.jsの単体テスト |
| `npm run test:browser` | Playwrightによる機能テスト（要ビルド・Python） |
| `npm run test:ux` | Playwrightによる操作・表示テスト（要ビルド・Python） |

## 環境変数

ビルド時に読み込みます。未設定なら既定値を使います。

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | `https://wakosen-app-api.yoking.dev/v1` | データ取得先。末尾の `/v1` は省略可 |
| `PUBLIC_SITE_URL` | `https://wakosen-app.yoking.dev` | OGPなどの絶対URL |

`PUBLIC_*` はクライアントに埋め込まれます。秘密鍵や認証トークンを設定しないでください。APIは公開JSONとCORS設定をそのまま利用します。

## 仕組み

```
src/pages/*.astro ──(ビルド時)──> prerender(screens/*) ──> 静的HTML + CSS
                                                               │ 初回描画後
                                                               ▼
                                     entries/*.tsx が画面単位で読み込まれ操作可能に
                                                               │
                                                               ▼
                                     data/api.ts が API を取得・キャッシュ
```

- **既存部品の再利用**: React Native Web製の画面部品をそのまま使い、Astroのビルド時にHTMLへ描画します。Expo Router・AsyncStorage・vector-iconsなどのExpo依存は [astro.config.mjs](../astro.config.mjs) のaliasで `src/platform/` の軽量な代替実装に置き換えます。ExpoランタイムとExpo Routerは配信しません。
- **読み込み**: JavaScriptは最初の描画後に画面単位で読み込みます。タブ移動では全体を再読み込みせず、選択日や画面状態を保持します。
- **テーマ**: ライト／ダーク両方の静的画面を生成し、保存済みテーマに合う方だけを初回描画から表示します（リロード時のちらつき防止）。
- **保存データ**: 設定と個人予定は従来版と同じlocalStorageキーを使います。同じ公開オリジンで移行すれば引き継がれますが、別ドメインのプレビューには移りません。

| ディレクトリ | 内容 |
| --- | --- |
| `src/pages/` | 各ページのAstroテンプレート（ビルド時描画のみ） |
| `src/screens/` | 画面のReactコンポーネント |
| `src/entries/` | 各画面のクライアント側起動処理 |
| `src/components/` `src/hooks/` `src/contexts/` | 画面部品・データ取得・設定などの共通処理 |
| `src/data/` | API取得とキャッシュ |
| `src/platform/` | Expo/React Native依存の代替実装、アイコンフォント |
| `public/` | `_headers`・`_redirects`・Service Worker・manifest・アイコン |
| `scripts/` | ビルド後処理、ローカル配信、テスト起動、アセット生成 |
| `tests/` | 単体テスト、Playwrightテスト、モックAPIとテストデータ |

### 画面ごとの挙動

- **寮食**: 日付のデータがない場合や週APIが404の場合は、選択日のメニュー領域に404と再読み込みボタンを表示します。日付選択と食事タブは操作できます。特定の食事だけが空の場合は通常の空表示です。
- **学則詳細**: `/school-rules/:ruleId` は共通の静的HTMLへ200 rewriteするため、ビルド後にAPIへ追加された学則もそのまま表示できます。OGPは共通のものになり、学則ごとには変わりません。
- **OGP**: 学則詳細以外の各ページはHTMLに固有のOGPを含みます。

## キャッシュとオフライン

| 対象 | 方針 |
| --- | --- |
| HTML / manifest / OGP / アイコン | 毎回HTTP再検証（`max-age=0, must-revalidate`） |
| `/_astro/` のハッシュ付きJS/CSS | 1年・immutable |
| API JSON | 保存済みデータを即表示し、画面を開くたびに `no-cache` で再検証。通信失敗時は保存済みデータを使用 |
| 寮食APIの404 | 該当週の保存データを破棄し、選択日の領域に404を表示 |
| 学則の図版 | 本文中で遅延読み込み。API側のHTTPキャッシュに従う |

**PWA**: 初回loadの5秒後にService Worker（従来と同じ `/expo-service-worker.js`）を登録し、画面HTMLと分割JSを保存します。これによりオフラインでも再起動・画面移動ができます。キャッシュのバージョンはビルド内容から生成し、更新後は古いキャッシュを削除します。

- APIはService Workerでは保存せず、画面側のデータ層で管理します。未取得のデータと図版はオフラインでは表示できません。
- 設定の「キャッシュ削除」はAPIデータだけを消し、個人予定と設定は残します。

## デプロイ（Cloudflare Workers / Pages）

### Cloudflare Workers

Workers BuildsのGit連携では、次の設定を使います。

| 項目 | 設定 |
| --- | --- |
| ルートディレクトリ | リポジトリのルート |
| Node.js | 24 |
| ビルドコマンド | `npm run build` |
| デプロイコマンド | `npx wrangler deploy` |

[wrangler.jsonc](../wrangler.jsonc) の `assets.directory` で `dist/` を指定し、静的サイトとして配信します。Wranglerは開発依存とlockfileでバージョンを管理します。

Wrangler設定がない状態で `wrangler deploy` を実行すると、Astroを自動検出してCloudflareアダプターを追加することがあります。これにより出力先が `dist/client/` へ変わると、`dist/_astro/` を使うビルド後処理が失敗します。このアプリでは静的配信用のWrangler設定を維持してください（[Cloudflare公式の静的Astroサイト向け設定](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/#if-you-have-a-static-site)）。

ローカルでは次のコマンドで、アップロードせずにビルドとデプロイ設定を検証できます。

```sh
npm run build
npm run check:deploy
```

`public/_redirects` の学則詳細は `/rule-detail/` へ200 rewriteします。`/rule-detail/index.html` を指定すると、CloudflareのHTML URL正規化で無効なルールと判定されるため、末尾スラッシュ付きのURLを使います。

### Cloudflare Pages

Git連携→ビルド→静的配信で運用します。Cloudflare Functions/SSRは使いません。

1. このリポジトリをPagesに接続する（ルートディレクトリは空欄）。
2. Node.js 24、ビルドコマンド `npm run export`、出力ディレクトリ `dist` を設定する。
3. 必要なら[環境変数](#環境変数)を設定し、プレビューURLで確認する。
4. 本番化するときに、カスタムドメインを新しいPagesプロジェクトへ接続する。

`public/_headers` と `public/_redirects` は出力にコピーされます。他の静的ホストを使う場合は、同等のHTTPヘッダーと学則詳細のrewriteを設定してください。

**切り戻し**: カスタムドメインを元のPagesプロジェクトに戻します。ブラウザに残るService Workerが更新されることも確認してください。このリポジトリを作成・pushしただけでは本番配信先は変わりません。

### ローカルでビルド結果を確認する

`astro preview` はPagesのrewriteを再現しません。学則詳細など動的IDを含むページは、Pagesと同じrewriteとBrotli配信を行う簡易サーバーで確認します。

```sh
npm run build
node scripts/serve.mjs   # http://127.0.0.1:4347
```

## テスト

```sh
npm run check
npm test
npm run build
python -m pip install playwright
python -m playwright install chromium
npm run test:browser
npm run test:ux
```

ブラウザテストは `scripts/serve.mjs`（4347番）と `tests/mock-api.cjs`（3001番）を起動し、本番APIへのリクエストをモックAPIへ差し替えます。ビルドは既定の環境変数のままで構いません。結果はGit管理外の `test-results/` に出力されます。

| テスト | 確認内容 |
| --- | --- |
| `test:browser` | 寮食404、キャッシュ破棄と復旧、タブ状態保持、API再検証、個人予定保存、テーマ、ビルド後の学則追加、OGP、PWAオフライン |
| `test:ux` | キャッシュ再検証時の表示、タブ読み込み、設定の操作、今日への即時スクロール、モーダルの暗幕、アイコンの描画位置 |
| `tests/theme.py` | テーマ切り替え（`node scripts/test-browser.mjs tests/theme.py`） |

GitHub Actions（[.github/workflows/ci.yml](../.github/workflows/ci.yml)）はpushとPRで上記すべてをChromium・Firefoxで実行し、ビルド後にWorkersデプロイのdry-runも検証します。

性能の測定条件と結果は [PERFORMANCE.md](../PERFORMANCE.md) を参照してください。0.5秒は初期表示の目標で、回線・端末・API応答を含めた保証値ではありません。

## アセットの保守

通常のビルドは生成済みアセットを使うため、Pythonや元のExpoプロジェクトは不要です。

- **アイコンを追加する**: `src/platform/icon-glyphs.json` にコードポイントを追加し、サブセットフォント `src/platform/icons.woff2` を再生成します。元フォントは `assets/` にあり、サイトには配信しません。

  ```sh
  pip install fonttools brotli
  python scripts/subset-icons.py
  ```

- **PWAアイコンを再生成する**: `node scripts/optimize-icons.mjs`

## リリース

`package.json` と `package-lock.json` の `version` を上げ（アプリ内の表示バージョンは `package.json` から読みます）、[src/constants/Changelog.ts](../src/constants/Changelog.ts) に変更点を追加します。変更履歴はアプリの設定画面に表示されます。
