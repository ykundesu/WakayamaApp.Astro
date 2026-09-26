<div align="center">

# 和歌山高専 非公式アプリ

<img src="./assets/icon.png" alt="和歌山高専 非公式アプリのアイコン" width="128">

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwakosen-app.yoking.dev&style=for-the-badge&label=Web)](https://wakosen-app.yoking.dev)
[![CI](https://img.shields.io/github/actions/workflow/status/ykundesu/WakayamaApp.Astro/ci.yml?style=for-the-badge&logo=github&label=CI)](https://github.com/ykundesu/WakayamaApp.Astro/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ykundesu/WakayamaApp.Astro?style=for-the-badge)](./LICENSE)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-blue?style=for-the-badge&logo=pwa)

**授業・寮食・寮の行事・学則を、スマホからすぐに確認できる和歌山高専の非公式アプリです。**

[<kbd> <br> アプリを開く <br> </kbd>](https://wakosen-app.yoking.dev)
<br><br>
[導入方法](#-導入方法) · [機能](#-機能) · [よくある質問](#-よくある質問) · [クレジット](#-クレジット) · [開発者向け](#-開発者向け)

</div>

> [!NOTE]
> 本アプリは学生が個人で開発している**非公式**のアプリで、和歌山工業高等専門学校とは関係ありません。掲載している情報は公式サイトから自動で取得したものです。正確な情報は必ず学校の公式サイトや掲示でご確認ください。

---

## 📥 使用方法

### 1. サイトを開く

スマホのブラウザで <https://wakosen-app.yoking.dev> を開きます。

### 2. 学生情報を設定する

初回は **入学年度** と **クラス** を選びます。自分のクラスの授業がホームと予定に表示されるようになります。

> [!TIP]
> 学生以外の方や入学前の方も、「**学生以外・入学前**」を選べば寮食・行事・学則を利用できます。設定はあとから「**設定**」→「**学生情報**」で変更できます。

### 3. ホーム画面に追加する（おすすめ）

| 端末 | 手順 |
|:---|:---|
| **iPhone / iPad（Safari）** | 共有ボタン →「**ホーム画面に追加**」 |
| **Android（Chrome）** | 画面に表示される「**インストール**」をタップ、またはメニュー →「**アプリをインストール**」 |
| **PC（Chrome / Edge）** | アドレスバー右側のインストールボタンをクリック |

ホーム画面に追加すると、ブラウザを開かずに起動でき、一度開いた画面はオフラインでも表示できます。

---

## ✨ 機能

### 🏠 ホーム

今日の授業、**次の授業**、**次の寮食**、**直近の行事**を1画面にまとめて表示します。

### 📅 予定

自分のクラスの授業スケジュールをカレンダーで確認できます。

- 前期・後期の時間割を日付ごとに表示し、現在の授業がひと目でわかります
- 部活動・委員会・自習などの**個人予定**を追加できます（毎週の繰り返しや適用期間も設定可能）
- 編入・休学・その他の理由で学年がずれる場合は、表示する学年を調整できます

### 🎉 行事

月例大掃除などの寮の行事を一覧で確認できます。

### 🍚 寮食

寮の朝食・昼食・夕食のメニューを日付ごとに確認できます。エネルギー・タンパク質・脂質・食塩相当量などの**栄養成分**も表示します。

### 📖 学則

学則などの規則を章ごとに閲覧できます。

- 規則名や条文での**検索**、目次から**章へジャンプ**
- 条文の**コピー**や、リンクの**共有**
- 元のPDFへのリンク
- **試験的機能のため不安定です**

### ⚙️ 設定

| 項目 | 内容 |
|:---|:---|
| **見た目** | テーマ（ライト / ダーク / 自動）とアクセントカラー |
| **下のナビゲーション** | よく使うタブを好きな順番に並べ替え・非表示 |
| **学生情報** | 入学年度・クラスの変更 |
| **キャッシュ** | 保存済みデータの削除（個人予定と設定は残ります） |
| **サポート** | 変更履歴の確認、お問い合わせ・誤りの報告 |

---

## ❓ よくある質問

<details>
<summary><b>データはいつ更新されますか？</b></summary>

データは更新後の朝に自動で取得されデータが置き換えられます。
詳細はこちらをご覧ください: [WakayamaApp自動化ワークフロー](https://github.com/ykundesu/WakayamaApp.ServerWorkflow)
</details>

<details>
<summary><b>オフラインでも使えますか？</b></summary>

ホーム画面に追加して一度開いた画面と、取得済みのデータはオフラインでも表示できます。まだ取得していないデータは表示できません。
</details>

<details>
<summary><b>個人予定や設定はどこに保存されますか？</b></summary>

お使いの端末のブラウザ内にだけ保存され、サーバーには送信されません。そのため別の端末やブラウザには引き継がれません。
</details>

<details>
<summary><b>情報が間違っています</b></summary>

「**設定**」→「**お問い合わせ・誤りの報告**」からお知らせください。
</details>

---

## 🙏 クレジット

| プロジェクト | 用途 |
|:---|:---|
| [Astro](https://github.com/withastro/astro) | サイトのビルド |
| [React](https://github.com/facebook/react) / [React Native Web](https://github.com/necolas/react-native-web) | 画面の部品 |
| [Material Design Icons](https://github.com/Templarian/MaterialDesign-Webfont) | アイコン |
| [markdown-it](https://github.com/markdown-it/markdown-it) / [DOMPurify](https://github.com/cure53/DOMPurify) | 学則本文の表示 |
第三者素材のライセンスは [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) を参照してください。

---

## 💻 開発者向け

Node.js 24 LTS が必要です。

```sh
npm ci
npm run dev    # http://127.0.0.1:4321
npm run build  # dist/ に静的サイトを出力
```

データはブラウザから [公開API](https://wakosen-app-api.yoking.dev/v1) で取得するため、データの更新にサイトの再ビルドは不要です。

構成、環境変数、キャッシュ方針、Cloudflare Pagesへのデプロイ、テスト、リリース手順は [開発者向けドキュメント](./docs/DEVELOPMENT.md) を、表示速度の測定結果は [PERFORMANCE.md](./PERFORMANCE.md) を参照してください。

## 📄 ライセンス

アプリのコードは [MIT License](./LICENSE) です。APIから取得する学校資料・データは本リポジトリのライセンスの対象外です。
