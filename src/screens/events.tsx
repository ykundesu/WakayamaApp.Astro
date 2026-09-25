import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { useDormitoryEvents } from "@/hooks/useDormitoryEvents";
import { useSettings, accentColors } from "@/contexts/SettingsContext";
import { useIsFocused } from "@/platform/navigation";
import { Colors } from "@/constants/Colors";
import { getFiscalYear } from "@/utils/classesUtils";
import {
  resolveEventDate,
  startOfDay,
  getGradeLabel,
} from "@/utils/eventsUtils";
import Icon from "@/components/ui/AppIcon";
import "@/styles/events.css";
const useBeforePaint =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
export default function EventsScreen() {
  const { events, loading, error, errorStatus, academicYear, refetch } =
    useDormitoryEvents();
  const s = useSettings();
  const palette = Colors[s.actualColorScheme];
  const focused = useIsFocused();
  const [mine, setMine] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const positioned = useRef(false);
  const today = startOfDay(new Date()).getTime();
  const grade =
    s.admissionYear === null
      ? null
      : Math.max(
          1,
          Math.min(5, getFiscalYear() - s.admissionYear + 1 + s.gradeOffset),
        );
  const days = useMemo(() => {
    const groups = new Map<number, typeof events>();
    for (const e of events) {
      const date = resolveEventDate(academicYear, e.date);
      if (!date || (mine && e.grade !== null && e.grade !== grade)) continue;
      const time = date.getTime();
      groups.set(time, [...(groups.get(time) || []), e]);
    }
    if (!groups.has(today)) groups.set(today, []);
    return [...groups].sort(([a], [b]) => a - b);
  }, [events, academicYear, mine, grade, today]);
  const jump = () => {
    const root = list.current;
    const target = marker.current;
    if (root && target)
      root.scrollTop +=
        target.getBoundingClientRect().top -
        root.getBoundingClientRect().top -
        16;
  };
  useBeforePaint(() => {
    if (!focused) {
      positioned.current = false;
      return;
    }
    if (loading || positioned.current) return;
    jump();
    positioned.current = true;
  }, [focused, loading, days]);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  const vars = {
    "--event-bg": palette.background,
    "--event-surface": palette.surface,
    "--event-text": palette.text,
    "--event-muted": palette.icon,
    "--event-border": palette.border,
    "--event-accent": accentColors[s.accentColor],
    "--event-soft": palette.surfaceMuted,
  } as React.CSSProperties;
  return (
    <section className="events-screen" style={vars} aria-label="行事一覧">
      <header className="events-toolbar">
        <div>
          <span className="events-eyebrow">
            {academicYear}年度 · 寮のカレンダー
          </span>
          <h1>行事</h1>
        </div>
        <div className="events-tools">
          <button onClick={jump} className="events-today-button">
            <Icon name="calendar-check" size={18} />
            今日
          </button>
          <button
            onClick={refresh}
            disabled={refreshing}
            aria-label="行事を再読み込み"
            className="events-refresh"
          >
            <Icon name="refresh" size={21} />
          </button>
        </div>
      </header>
      <div className="events-filter">
        <span>日付順に表示</span>
        {grade !== null && (
          <label>
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => {
                setMine(e.target.checked);
                positioned.current = false;
              }}
            />
            自分の学年のみ <span>（{grade}年）</span>
          </label>
        )}
      </div>
      <div className="events-scroll" ref={list} data-testid="events-scroll">
        <div className="events-timeline">
          {loading && events.length === 0 ? (
            <div className="events-state" role="status">
              <span className="route-spinner" />
              行事を読み込んでいます…
            </div>
          ) : error && events.length === 0 ? (
            <div className="events-state">
              <Icon name="calendar-remove-outline" size={32} />
              <h2>
                {errorStatus === 404
                  ? "行事データはまだありません"
                  : "行事を取得できませんでした"}
              </h2>
              <p>
                {errorStatus === 404
                  ? "公式サイトで予定が公開されていない可能性があります。"
                  : error}
              </p>
              <button onClick={refresh}>再読み込み</button>
            </div>
          ) : (
            days.map(([time, items], i) => {
              const date = new Date(time);
              const isToday = time === today;
              const previous = days[i - 1];
              const monthChanged =
                !previous ||
                new Date(previous[0]).getMonth() !== date.getMonth() ||
                new Date(previous[0]).getFullYear() !== date.getFullYear();
              return (
                <React.Fragment key={time}>
                  {monthChanged && (
                    <h2 className="events-month">
                      {date.getFullYear()}
                      <strong>{date.getMonth() + 1}月</strong>
                    </h2>
                  )}
                  <div
                    ref={isToday ? marker : undefined}
                    data-today={isToday || undefined}
                    className={`events-day ${isToday ? "is-today" : ""} ${time < today ? "is-past" : ""}`}
                  >
                    <div className="events-date">
                      <span>{date.getMonth() + 1}月</span>
                      <strong>{date.getDate()}</strong>
                      <span>
                        {
                          ["日", "月", "火", "水", "木", "金", "土"][
                            date.getDay()
                          ]
                        }
                        曜日
                      </span>
                      {isToday && <b>今日</b>}
                    </div>
                    <div className="events-day-items">
                      {items.length ? (
                        items.map((item, index) => (
                          <article className="events-item" key={index}>
                            <div className="events-item-meta">
                              <span
                                className={`events-grade ${grade !== null && item.grade === grade ? "is-mine" : ""}`}
                              >
                                {getGradeLabel(item.grade)}
                              </span>
                              {grade !== null && item.grade === grade && (
                                <span className="events-relevant">
                                  あなたの学年
                                </span>
                              )}
                            </div>
                            <h3>{item.name}</h3>
                          </article>
                        ))
                      ) : (
                        <div className="events-empty-day">
                          今日の行事はありません
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <footer className="events-source">
            <p>
              公式サイトから取得した情報です。最新の予定は公式サイトをご確認ください。
            </p>
            <a
              href="https://www.wakayama-nct.ac.jp/campuslife/dormitory/calendar/"
              target="_blank"
              rel="noopener noreferrer"
            >
              公式の行事予定
              <Icon name="open-in-new" size={14} />
            </a>
          </footer>
        </div>
      </div>
    </section>
  );
}
