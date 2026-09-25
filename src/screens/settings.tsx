import React, { useState } from "react";
import {
  useSettings,
  accentColors,
  accentColorNames,
  type AccentColor,
  type StudentClass,
} from "@/contexts/SettingsContext";
import { Colors } from "@/constants/Colors";
import {
  TAB_DEFINITIONS,
  DEFAULT_TAB_LAYOUT,
  type TabId,
} from "@/constants/Tabs";
import { APP_VERSION } from "@/constants/AppInfo";
import { getFiscalYear } from "@/utils/classesUtils";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";
import { followLink } from "@/platform/router";
import storage from "@/platform/storage";
import Icon from "@/components/ui/AppIcon";
import "@/styles/settings.css";

export default function SettingsScreen() {
  const s = useSettings();
  const palette = Colors[s.actualColorScheme];
  const { isInstallable, isIosManualInstall, promptInstall } =
    usePwaInstallPrompt();
  const [notice, setNotice] = useState("");
  const [clearing, setClearing] = useState(false);
  const fiscal = getFiscalYear();
  const grade =
    s.admissionYear === null
      ? null
      : Math.max(1, Math.min(5, fiscal - s.admissionYear + 1 + s.gradeOffset));
  const move = (id: TabId, offset: number) => {
    const list = s.tabLayout.filter((t) => t.id !== "settings");
    const index = list.findIndex((t) => t.id === id);
    const to = index + offset;
    if (index < 0 || to < 0 || to >= list.length) return;
    [list[index], list[to]] = [list[to], list[index]];
    s.setTabLayout([...list, { id: "settings", visible: true }]);
  };
  const clear = async () => {
    setClearing(true);
    try {
      const keys = (await storage.getAllKeys()).filter(
        (k) => k.startsWith("cache_") || k.startsWith("wakosen-api-v1:"),
      );
      await storage.multiRemove(keys);
      setNotice(
        keys.length
          ? "キャッシュを削除しました。次に画面を開くと最新データを取得します。"
          : "削除できるキャッシュはありません。",
      );
    } catch {
      setNotice("削除できませんでした。もう一度お試しください。");
    } finally {
      setClearing(false);
    }
  };
  const install = async () => {
    try {
      const result = await promptInstall();
      setNotice(
        result === "accepted"
          ? "ホーム画面に追加しました。"
          : result === "unavailable"
            ? "ブラウザのメニューからホーム画面に追加できます。"
            : "追加をキャンセルしました。",
      );
    } catch {
      setNotice("ブラウザのメニューからホーム画面に追加してください。");
    }
  };
  const vars = {
    "--settings-bg": palette.background,
    "--settings-surface": palette.surface,
    "--settings-text": palette.text,
    "--settings-muted": palette.icon,
    "--settings-border": palette.border,
    "--settings-accent": accentColors[s.accentColor],
    "--settings-soft": palette.surfaceMuted,
  } as React.CSSProperties;
  return (
    <div className="settings-screen" style={vars}>
      <div className="settings-wrap">
        <header className="settings-heading">
          <div>
            <span className="settings-eyebrow">アプリを自分に合わせる</span>
            <h1>設定</h1>
            <p>授業の表示や、いつもの使い方を整えましょう。</p>
          </div>
          <span className="settings-saved">
            <Icon name="check-circle" size={16} />
            自動保存
          </span>
        </header>
        <div className="settings-grid">
          <section
            className="settings-panel"
            aria-labelledby="settings-student"
          >
            <div className="settings-section-heading">
              <span className="settings-section-icon">
                <Icon name="school-outline" size={22} />
              </span>
              <div>
                <h2 id="settings-student">学生情報</h2>
                <p>ホームと予定に表示する授業</p>
              </div>
            </div>
            <div className="settings-profile">
              <span>現在の表示</span>
              <strong>
                {grade === null
                  ? "学生以外として利用"
                  : `${grade}年 ${s.studentClass}組`}
              </strong>
              <small>
                {s.admissionYear === null
                  ? "行事・寮食・学則を利用できます"
                  : `${s.admissionYear}年度入学 · ${fiscal}年度`}
              </small>
            </div>
            <div className="settings-fields">
              <label>
                入学年度
                <select
                  aria-label="入学年度"
                  value={s.admissionYear ?? "none"}
                  onChange={(e) =>
                    s.setAdmissionYear(
                      e.target.value === "none" ? null : Number(e.target.value),
                    )
                  }
                >
                  {Array.from({ length: 5 }, (_, i) => fiscal - i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}年度
                      </option>
                    ),
                  )}
                  <option value="none">学生以外・入学前</option>
                </select>
              </label>
              <label>
                クラス
                <select
                  aria-label="クラス"
                  disabled={s.admissionYear === null}
                  value={s.studentClass}
                  onChange={(e) =>
                    s.setStudentClass(e.target.value as StudentClass)
                  }
                >
                  {["A", "B", "C", "D"].map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}組
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <details className="settings-advanced">
              <summary>表示される学年が違うとき</summary>
              <p>編入・休学などで学年が合わない場合に調整できます。</p>
              <label>
                学年の調整
                <select
                  disabled={s.admissionYear === null}
                  value={s.gradeOffset}
                  onChange={(e) => s.setGradeOffset(Number(e.target.value))}
                >
                  {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "調整なし" : `${n > 0 ? "+" : ""}${n}年`}
                    </option>
                  ))}
                </select>
              </label>
            </details>
          </section>
          <section
            className="settings-panel"
            aria-labelledby="settings-appearance"
          >
            <div className="settings-section-heading">
              <span className="settings-section-icon">
                <Icon name="palette" size={22} />
              </span>
              <div>
                <h2 id="settings-appearance">見た目</h2>
                <p>テーマとアクセントカラー</p>
              </div>
            </div>
            <fieldset className="settings-choice">
              <legend>テーマ</legend>
              <div className="settings-themes">
                {(
                  [
                    {
                      id: "light",
                      label: "ライト",
                      icon: "white-balance-sunny",
                    },
                    {
                      id: "dark",
                      label: "ダーク",
                      icon: "moon-waning-crescent",
                    },
                    { id: "auto", label: "自動", icon: "theme-light-dark" },
                  ] as const
                ).map((t) => (
                  <label
                    key={t.id}
                    className={s.colorScheme === t.id ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="appearance"
                        aria-label={t.label}
                      value={t.id}
                      checked={s.colorScheme === t.id}
                      onChange={() => s.setColorScheme(t.id)}
                    />
                    <Icon name={t.icon} size={24} />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
              <p>「自動」は端末の明るさ設定に合わせます。</p>
            </fieldset>
            <fieldset className="settings-choice">
              <legend>
                アクセントカラー <span>{accentColorNames[s.accentColor]}</span>
              </legend>
              <div className="settings-colors">
                {(Object.keys(accentColors) as AccentColor[]).map((c) => (
                  <label
                    key={c}
                    title={accentColorNames[c]}
                    style={
                      { "--swatch": accentColors[c] } as React.CSSProperties
                    }
                  >
                    <input
                      type="radio"
                      name="accent"
                      aria-label={accentColorNames[c]}
                      checked={s.accentColor === c}
                      onChange={() => s.setAccentColor(c)}
                    />
                    <span>
                      {s.accentColor === c && (
                        <Icon name="check" size={20} color="white" />
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
          <section
            className="settings-panel settings-tabs-panel"
            aria-labelledby="settings-tabs"
          >
            <div className="settings-section-heading">
              <span className="settings-section-icon">
                <Icon name="view-dashboard-outline" size={22} />
              </span>
              <div>
                <h2 id="settings-tabs">下のナビゲーション</h2>
                <p>よく使う画面を、好きな順番に</p>
              </div>
              <button
                className="settings-text-button"
                onClick={() => s.setTabLayout(DEFAULT_TAB_LAYOUT)}
              >
                標準に戻す
              </button>
            </div>
            <ol className="settings-tab-list">
              {s.tabLayout.map((item, index) => {
                const tab = TAB_DEFINITIONS.find((t) => t.id === item.id)!;
                return (
                  <li key={item.id} className={!item.visible ? "muted" : ""}>
                    <span className="settings-order">{index + 1}</span>
                    <Icon name={tab.icon} size={22} />
                    <span className="settings-tab-name">{tab.title}</span>
                    {tab.isPinned ? (
                      <span className="settings-fixed">
                        <Icon name="lock" size={14} />
                        固定
                      </span>
                    ) : (
                      <>
                        <div className="settings-move">
                          <button
                            aria-label={`${tab.title}を上へ移動`}
                            disabled={index === 0}
                            onClick={() => move(item.id, -1)}
                          >
                            <Icon name="chevron-up" size={20} />
                          </button>
                          <button
                            aria-label={`${tab.title}を下へ移動`}
                            disabled={index === s.tabLayout.length - 2}
                            onClick={() => move(item.id, 1)}
                          >
                            <Icon name="chevron-down" size={20} />
                          </button>
                        </div>
                        <label className="settings-switch">
                          <input
                            type="checkbox"
                            role="switch"
                            aria-label={`${tab.title}を表示`}
                            checked={item.visible}
                            onChange={() =>
                              s.setTabLayout(
                                s.tabLayout.map((t) =>
                                  t.id === item.id
                                    ? { ...t, visible: !t.visible }
                                    : t,
                                ),
                              )
                            }
                          />
                          <span />
                        </label>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="settings-footnote">
              設定はいつでも開けるように、最後に固定されています。
            </p>
          </section>
          <section className="settings-panel" aria-labelledby="settings-app">
            <div className="settings-section-heading">
              <span className="settings-section-icon">
                <Icon name="information-outline" size={22} />
              </span>
              <div>
                <h2 id="settings-app">アプリについて</h2>
                <p>サポートとデータ管理</p>
              </div>
            </div>
            <div className="settings-actions">
              <a href="/changelog" onClick={followLink}>
                <Icon name="history" size={21} />
                <span>
                  変更履歴<small>バージョン {APP_VERSION}</small>
                </span>
                <Icon name="chevron-right" size={20} />
              </a>
              <a
                href="https://forms.gle/p1AxsBk9WLz8HrWR6"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="send" size={21} />
                <span>
                  お問い合わせ・誤りの報告<small>フォームを開きます</small>
                </span>
                <Icon name="open-in-new" size={18} />
              </a>
              {isInstallable && (
                <button onClick={install}>
                  <Icon name="download-circle" size={21} />
                  <span>
                    ホーム画面に追加<small>アプリとしてすぐに開けます</small>
                  </span>
                  <Icon name="plus" size={20} />
                </button>
              )}
            </div>
            {isIosManualInstall && (
              <p className="settings-footnote">
                Safariの共有メニューから「ホーム画面に追加」を選べます。
              </p>
            )}
            <div className="settings-cache">
              <div>
                <h3>データのキャッシュ</h3>
                <p>
                  表示が古いときに削除できます。
                  <br />
                  個人予定と設定は残ります。
                </p>
              </div>
              <button
                className="settings-outline-button"
                disabled={clearing}
                onClick={clear}
              >
                {clearing ? "削除中…" : "削除"}
              </button>
            </div>
            <p className="settings-notice" role="status">
              {notice}
            </p>
          </section>
        </div>
        <footer className="settings-footer">
          和歌山高専 非公式アプリ <span>v{APP_VERSION}</span>
        </footer>
      </div>
    </div>
  );
}
