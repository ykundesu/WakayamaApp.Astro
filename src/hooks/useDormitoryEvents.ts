import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiUrl } from '@/constants/Api';
import { getFiscalYear } from '@/utils/classesUtils';
import { normalizeEventDateToken } from '@/utils/eventsUtils';
import type { DormitoryEvent, DormitoryEventsPayload } from '@/types/dormitoryEvents';

const CACHE_TTL_MS = 0;
const CACHE_PREFIX = 'cache_dormitory_events';

const EVENTS_URL = (year: number) => apiUrl(`/dormitory/events/${year}.json`);

class HttpStatusError extends Error {
  status: number;

  constructor(status: number) {
    super(`行事データの取得に失敗しました (status: ${status})`);
    this.name = 'HttpStatusError';
    this.status = status;
  }
}

type CachedPayload = {
  timestamp: number;
  data: DormitoryEventsPayload;
};

function normalizeEvent(raw: unknown): DormitoryEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  if (!name) return null;

  const dateRaw = typeof candidate.date === 'string' ? candidate.date : String(candidate.date ?? '');
  const date = normalizeEventDateToken(dateRaw);
  if (!date) return null;

  let grade: number | null = null;
  if (typeof candidate.grade === 'number' && Number.isFinite(candidate.grade)) {
    grade = candidate.grade;
  } else if (typeof candidate.grade === 'string') {
    const parsed = Number.parseInt(candidate.grade, 10);
    grade = Number.isNaN(parsed) ? null : parsed;
  }

  if (grade !== null && (grade < 1 || grade > 5)) {
    grade = null;
  }

  return { date, grade, name };
}

function normalizePayload(raw: unknown, fallbackYear: number): DormitoryEventsPayload {
  const root = raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)
    ? (raw as Record<string, unknown>).data
    : raw;
  const obj = (root && typeof root === 'object') ? (root as Record<string, unknown>) : {};

  let academicYear = fallbackYear;
  const rawYear = obj.academic_year ?? obj.academicYear;
  if (typeof rawYear === 'number' && Number.isFinite(rawYear)) {
    academicYear = rawYear;
  } else if (typeof rawYear === 'string') {
    const parsed = Number.parseInt(rawYear, 10);
    if (!Number.isNaN(parsed)) academicYear = parsed;
  }

  const rawEvents = Array.isArray(obj.events)
    ? obj.events
    : (Array.isArray(root) ? root : []);

  const seen = new Set<string>();
  const events: DormitoryEvent[] = [];
  rawEvents.forEach((item) => {
    const normalized = normalizeEvent(item);
    if (!normalized) return;
    const key = `${normalized.date}-${normalized.grade ?? 'all'}-${normalized.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push(normalized);
  });

  return { academic_year: academicYear, events };
}

async function readCache(cacheKey: string): Promise<CachedPayload | null> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as CachedPayload;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.data || typeof parsed.data !== 'object') return null;
    if (typeof parsed.timestamp !== 'number') return null;
    return parsed;
  } catch (error) {
    console.warn('[useDormitoryEvents] Failed to read cache', error);
    return null;
  }
}

async function writeCache(cacheKey: string, data: DormitoryEventsPayload) {
  const payload: CachedPayload = {
    timestamp: Date.now(),
    data,
  };
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch (error) {
    console.warn('[useDormitoryEvents] Failed to write cache', error);
  }
}

async function fetchDormitoryEvents(url: string, fallbackYear: number, cacheKey: string): Promise<DormitoryEventsPayload> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new HttpStatusError(res.status);
    }
    const json = await res.json();
    const payload = normalizePayload(json, fallbackYear);
    await writeCache(cacheKey, payload);
    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useDormitoryEvents(requestedYear?: number) {
  const academicYear = useMemo(() => requestedYear ?? getFiscalYear(), [requestedYear]);
  const [payload, setPayload] = useState<DormitoryEventsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const payloadRef = useRef<DormitoryEventsPayload | null>(null);
  const eventsUrl = useMemo(() => EVENTS_URL(academicYear), [academicYear]);
  const cacheKey = useMemo(() => `${CACHE_PREFIX}:${eventsUrl}`, [eventsUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  const load = useCallback(async (force = false) => {
    setLoading(prev => (payloadRef.current ? prev : true));
    try {
      const cached = await readCache(cacheKey);
      if (cached && mountedRef.current) {
        const normalized = normalizePayload(cached.data, academicYear);
        setPayload(normalized);
        setError(null);
        setErrorStatus(null);
      }

      const shouldRefresh =
        force || !cached || Date.now() - cached.timestamp > CACHE_TTL_MS;

      if (shouldRefresh) {
        const data = await fetchDormitoryEvents(eventsUrl, academicYear, cacheKey);
        if (mountedRef.current) {
          setPayload(data);
          setError(null);
          setErrorStatus(null);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '行事データの取得に失敗しました';
      if (!payloadRef.current) {
        setError(message);
        setErrorStatus(err instanceof HttpStatusError ? err.status : null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [academicYear, cacheKey, eventsUrl]);

  useEffect(() => {
    const bootstrap = async () => {
      await load(false);
    };
    bootstrap();
  }, [load]);

  const refetch = useCallback(async () => {
    await load(true);
  }, [load]);

  return {
    academicYear: payload?.academic_year ?? academicYear,
    events: payload?.events ?? [],
    loading,
    error,
    errorStatus,
    refetch,
  };
}
