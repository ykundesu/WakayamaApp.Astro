import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useIsFocused } from '@/platform/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, apiUrl } from '@/constants/Api';
import {
  RuleSearchResult,
  SchoolRule,
  SchoolRuleChapter,
  SchoolRuleSection,
  SchoolRulesPayload,
} from '@/types/schoolRules';

const SCHOOL_RULES_URL = apiUrl('/school-rules/index.json');
const RULE_DETAIL_URL = (ruleId: string) => apiUrl(`/school-rules/rules/${ruleId}.json`);
const CACHE_KEY = `cache_school_rules_v1:${API_BASE_URL}`;
const CACHE_TTL_MS = 0; // Revalidate on each screen visit.

type CachedPayload = {
  timestamp: number;
  data: SchoolRulesPayload;
};

let memoryCache: SchoolRulesPayload | null = null;
let memoryTimestamp = 0;
let inFlightPromise: Promise<SchoolRulesPayload> | null = null;
const inFlightRulePromises = new Map<string, Promise<SchoolRule | null>>();

function isSchoolRule(obj: any): obj is SchoolRule {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.chapterId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.order === 'number' &&
    typeof obj.pdfUrl === 'string'
  );
}

function isChapter(obj: any): obj is SchoolRuleChapter {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.order === 'number' &&
    Array.isArray(obj.ruleIds)
  );
}

function normalizePayload(raw: any): SchoolRulesPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('学則データの形式が不正です');
  }

  const chapters = Array.isArray(raw.chapters) ? raw.chapters.filter(isChapter) : [];
  const rules = Array.isArray(raw.rules) ? raw.rules.filter(isSchoolRule) : [];

  if (chapters.length === 0 || rules.length === 0) {
    throw new Error('学則データが空、または正しくパースできませんでした');
  }

  return {
    version: typeof raw.version === 'string' ? raw.version : 'v1',
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : '',
    chapters,
    rules,
  };
}

async function readCache(): Promise<CachedPayload | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!parsed || typeof parsed !== 'object') return null;
    const data = normalizePayload(parsed.data);
    const timestamp = typeof parsed.timestamp === 'number' ? parsed.timestamp : 0;
    return { data, timestamp };
  } catch (error) {
    console.warn('[useSchoolRules] Failed to read cache', error);
    return null;
  }
}

async function writeCache(data: SchoolRulesPayload) {
  const payload: CachedPayload = {
    timestamp: Date.now(),
    data,
  };
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[useSchoolRules] Failed to write cache', error);
  }
}

async function fetchSchoolRules(): Promise<SchoolRulesPayload> {
  if (memoryCache && Date.now() - memoryTimestamp < CACHE_TTL_MS) {
    return memoryCache;
  }
  if (inFlightPromise) {
    return inFlightPromise;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  const promise = (async () => {
    try {
      const response = await fetch(SCHOOL_RULES_URL, {
        signal: controller.signal, cache: 'no-cache'
      });
      if (!response.ok) {
        throw new Error(`学則データの取得に失敗しました (status: ${response.status})`);
      }
      const json = await response.json();
      const payload = normalizePayload(json);
      memoryCache = payload;
      memoryTimestamp = Date.now();
      writeCache(payload).catch(() => {});
      return payload;
    } finally {
      clearTimeout(timeoutId);
      inFlightPromise = null;
    }
  })();

  inFlightPromise = promise;
  return promise;
}

async function fetchRuleDetail(ruleId: string): Promise<SchoolRule | null> {
  // タイムアウト付きのフェッチ
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(RULE_DETAIL_URL(ruleId), { signal: controller.signal, cache: 'no-cache' });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`規則の取得に失敗しました (status: ${res.status})`);
    }
    const json = await res.json();

    // 返却形式に柔軟に対応
    const candidate = (json && typeof json === 'object')
      ? ((json.rule as unknown) ?? (json.data as unknown) ?? json)
      : null;

    if (isSchoolRule(candidate)) {
      return candidate as SchoolRule;
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildIndexes(payload: SchoolRulesPayload | null) {
  const rulesById = new Map<string, SchoolRule>();
  const chaptersById = new Map<string, SchoolRuleChapter>();

  if (payload) {
    payload.rules.forEach((rule) => rulesById.set(rule.id, rule));
    payload.chapters.forEach((chapter) => chaptersById.set(chapter.id, chapter));
  }

  return { rulesById, chaptersById };
}

function buildSearchResults(
  payload: SchoolRulesPayload | null,
  query: string,
): RuleSearchResult[] {
  if (!payload || !query.trim()) return [];
  const normalized = query.trim();
  const lower = normalized.toLowerCase();

  const results: RuleSearchResult[] = [];

  for (const rule of payload.rules) {
    const chapterId = rule.chapterId;

    if (rule.title.toLowerCase().includes(lower)) {
      results.push({
        ruleId: rule.id,
        chapterId,
        title: rule.title,
        summary: rule.summary,
        matchType: 'title',
      });
      continue;
    }

    if (rule.summary && rule.summary.toLowerCase().includes(lower)) {
      results.push({
        ruleId: rule.id,
        chapterId,
        title: rule.title,
        summary: rule.summary,
        matchedText: rule.summary,
        matchType: 'summary',
      });
      continue;
    }

    const collections: SchoolRuleSection[] = rule.sections ?? [];
    const fallbackArticles = rule.articles ?? [];

    for (const section of collections) {
      for (const article of section.articles) {
        if (
          article.label?.toLowerCase().includes(lower) ||
          article.body?.toLowerCase().includes(lower)
        ) {
          results.push({
            ruleId: rule.id,
            chapterId,
            title: rule.title,
            summary: rule.summary,
            matchedText: article.body,
            articleLabel: article.label,
            matchType: 'article',
          });
          break;
        }
      }
    }

    if (results.some((item) => item.ruleId === rule.id)) {
      continue;
    }

    for (const article of fallbackArticles) {
      if (
        article.label?.toLowerCase().includes(lower) ||
        article.body?.toLowerCase().includes(lower)
      ) {
        results.push({
          ruleId: rule.id,
          chapterId,
          title: rule.title,
          summary: rule.summary,
          matchedText: article.body,
          articleLabel: article.label,
          matchType: 'article',
        });
        break;
      }
    }
  }

  return results;
}

export function useSchoolRules() {
  const focused = useIsFocused();
  const revalidatedRules = useRef(new Set<string>());
  const [payload, setPayload] = useState<SchoolRulesPayload | null>(memoryCache);
  const [loading, setLoading] = useState<boolean>(!memoryCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!focused) return;
    revalidatedRules.current.clear();
    let mounted = true;

    const bootstrap = async () => {
      setLoading(!memoryCache);
      try {
        if (!memoryCache) {
          const cached = await readCache();
          if (cached) {
            memoryCache = cached.data;
            memoryTimestamp = cached.timestamp;
            if (mounted) {
              setPayload(cached.data);
              setLoading(false);
              setError(null);
            }
          }
        }

        const shouldRefresh =
          !memoryCache || Date.now() - memoryTimestamp > CACHE_TTL_MS;

        if (shouldRefresh) {
          const data = await fetchSchoolRules();
          if (mounted) {
            setPayload(data);
            setError(null);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : '学則データの取得に失敗しました';
        if (!memoryCache) {
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [focused]);

  const { rulesById, chaptersById } = useMemo(() => buildIndexes(payload), [payload]);

  const refetch = useCallback(async () => {
    revalidatedRules.current.clear();
    setLoading(true);
    try {
      const data = await fetchSchoolRules();
      setPayload(data);
      setError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '学則データの再取得に失敗しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRuleById = useCallback(
    (ruleId: string | null | undefined) => {
      if (!ruleId) return null;
      return rulesById.get(ruleId) ?? null;
    },
    [rulesById],
  );

  const getChapterById = useCallback(
    (chapterId: string | null | undefined) => {
      if (!chapterId) return null;
      return chaptersById.get(chapterId) ?? null;
    },
    [chaptersById],
  );

  const getRulesByChapter = useCallback(
    (chapterId: string | null | undefined) => {
      if (!chapterId || !payload) return [];
      const chapter = chaptersById.get(chapterId);
      if (!chapter) return [];
      return chapter.ruleIds
        .map((id) => rulesById.get(id))
        .filter((rule): rule is SchoolRule => Boolean(rule))
        .sort((a, b) => a.order - b.order);
    },
    [chaptersById, payload, rulesById],
  );

  const searchRules = useCallback(
    (query: string) => buildSearchResults(payload, query),
    [payload],
  );

  const ensureRuleLoaded = useCallback(async (ruleId: string): Promise<SchoolRule | null> => {
    if (!ruleId) return null;

    // 既に詳細が揃っているならそのまま返す
    const existing = rulesById.get(ruleId) ?? null;
    if (revalidatedRules.current.has(ruleId) && existing && ((existing.sections && existing.sections.length > 0) || (existing.articles && existing.articles.length > 0))) {
      return existing;
    }

    // 同一IDの重複フェッチを防ぐ
    if (inFlightRulePromises.has(ruleId)) {
      return inFlightRulePromises.get(ruleId)!;
    }

    const p = (async () => {
      try {
        const detail = await fetchRuleDetail(ruleId);
        revalidatedRules.current.add(ruleId);
        if (!detail) {
          return existing; // 404等の場合は既存情報を返却
        }

        setPayload((prev) => {
          if (!prev) {
            // まだ全体ペイロードが未取得の場合は、最低限の形で構築
            const minimal: SchoolRulesPayload = {
              version: 'v1',
              generatedAt: new Date().toISOString(),
              chapters: [],
              rules: [detail],
            };
            memoryCache = minimal;
            memoryTimestamp = Date.now();
            writeCache(minimal).catch(() => {});
            return minimal;
          }

          // 既存のrulesにマージ（同一IDは置き換え）
          const nextRules = [...prev.rules];
          const idx = nextRules.findIndex((r) => r.id === detail.id);
          if (idx >= 0) {
            nextRules[idx] = { ...nextRules[idx], ...detail };
          } else {
            nextRules.push(detail);
          }

          // chapter.ruleIdsへの登録（存在すれば）
          const nextChapters = [...prev.chapters];
          const chIdx = nextChapters.findIndex((c) => c.id === detail.chapterId);
          if (chIdx >= 0) {
            const setIds = new Set(nextChapters[chIdx].ruleIds);
            setIds.add(detail.id);
            nextChapters[chIdx] = { ...nextChapters[chIdx], ruleIds: Array.from(setIds) };
          }

          const next: SchoolRulesPayload = { ...prev, rules: nextRules, chapters: nextChapters };
          memoryCache = next;
          memoryTimestamp = Date.now();
          writeCache(next).catch(() => {});
          return next;
        });

        return detail;
      } finally {
        inFlightRulePromises.delete(ruleId);
      }
    })();

    inFlightRulePromises.set(ruleId, p);
    return p;
  }, [rulesById]);

  return {
    payload,
    chapters: payload?.chapters ?? [],
    rules: payload?.rules ?? [],
    loading,
    error,
    refetch,
    getRuleById,
    getChapterById,
    getRulesByChapter,
    searchRules,
    ensureRuleLoaded,
  };
}
