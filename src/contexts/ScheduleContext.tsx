import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeDefaultSemester, getFiscalYear } from '@/utils/classesUtils';
import {
  GetSchedulesForContextParams,
  ResolvedScheduleInstance,
  ScheduleDraft,
  ScheduleEntry,
} from '@/types/schedule';

const STORAGE_KEY = '@wakayama/schedules';

type ScheduleContextValue = {
  schedules: ScheduleEntry[];
  isLoading: boolean;
  addSchedule: (entry: ScheduleDraft) => Promise<ScheduleEntry>;
  updateSchedule: (id: string, updates: ScheduleDraft) => Promise<ScheduleEntry | null>;
  removeSchedule: (id: string) => Promise<void>;
  getSchedulesForContext: (params: GetSchedulesForContextParams) => ResolvedScheduleInstance[];
};

const ScheduleContext = createContext<ScheduleContextValue | undefined>(undefined);

function parseDateOnly(value?: string): Date | null {
  if (!value) return null;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSemesterRange(fiscalYear: number, semester: '0' | '1') {
  if (semester === '0') {
    return {
      start: new Date(fiscalYear, 3, 1),
      end: new Date(fiscalYear, 7, 31, 23, 59, 59, 999),
    } as const;
  }
  return {
    start: new Date(fiscalYear, 8, 1),
    end: new Date(fiscalYear + 1, 2, 31, 23, 59, 59, 999),
  } as const;
}

function intersectWithSemester(
  semesterRange: ReturnType<typeof getSemesterRange>,
  effectiveFrom?: string,
  effectiveTo?: string,
): { start: Date; end: Date } | null {
  const fromDate = parseDateOnly(effectiveFrom) ?? semesterRange.start;
  const toDate = parseDateOnly(effectiveTo) ?? semesterRange.end;
  const start = fromDate > semesterRange.start ? fromDate : semesterRange.start;
  const end = toDate < semesterRange.end ? toDate : semesterRange.end;
  if (start > end) {
    return null;
  }
  return { start, end };
}

function findFirstWeekdayInRange(dayOfWeek: number, range: { start: Date; end: Date }): Date | null {
  const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
  const end = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());
  const targetJsDay = (dayOfWeek + 1) % 7;
  const diff = (targetJsDay - start.getDay() + 7) % 7;
  const candidate = new Date(start);
  candidate.setDate(candidate.getDate() + diff);
  if (candidate > end) {
    return null;
  }
  return candidate;
}

function shouldIncludeByDateRange(
  range: { start: Date; end: Date } | null,
  dayOfWeek: number,
): Date | null {
  if (!range) return null;
  return findFirstWeekdayInRange(dayOfWeek, range);
}

function buildResolvedInstance(
  entry: ScheduleEntry,
  occurrenceDate: Date,
): ResolvedScheduleInstance {
  return {
    entryId: entry.id,
    title: entry.title,
    category: entry.category,
    recurrence: entry.recurrence,
    startTime: entry.startTime,
    endTime: entry.endTime,
    dayOfWeek: entry.dayOfWeek ?? ((occurrenceDate.getDay() + 6) % 7),
    occurrenceDate: formatDateOnly(occurrenceDate),
    effectiveFrom: entry.effectiveFrom,
    effectiveTo: entry.effectiveTo,
    notes: entry.notes,
    targetFiscalYear: entry.targetFiscalYear,
  };
}

function normaliseDayOfWeek(value?: number, fallback?: number): number | undefined {
  if (typeof value === 'number' && value >= 0 && value <= 6) {
    return value;
  }
  return fallback;
}

function ensureFiscalYear(entry: ScheduleDraft): number | undefined {
  if (entry.recurrence === 'fiscalYear' || entry.recurrence === 'semesterFirst' || entry.recurrence === 'semesterSecond') {
    return entry.targetFiscalYear ?? getFiscalYear();
  }
  if (entry.recurrence === 'once' && entry.oneTimeDate) {
    const date = parseDateOnly(entry.oneTimeDate);
    if (date) {
      return getFiscalYear(date);
    }
  }
  return entry.targetFiscalYear;
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: ScheduleEntry[] = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setSchedules(parsed);
          }
        }
      } catch (error) {
        console.error('カスタム予定の読み込みに失敗しました', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const persist = useCallback(async (next: ScheduleEntry[]) => {
    setSchedules(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('カスタム予定の保存に失敗しました', error);
    }
  }, []);

  const addSchedule = useCallback(async (entry: ScheduleDraft) => {
    const now = new Date();
    const id = entry.id ?? `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const fallbackJsDay = entry.oneTimeDate ? parseDateOnly(entry.oneTimeDate)?.getDay() : undefined;
    const fallbackDay = typeof fallbackJsDay === 'number' ? ((fallbackJsDay + 6) % 7) : undefined;
    const dayOfWeek = normaliseDayOfWeek(entry.dayOfWeek, fallbackDay);
    
    // Support both daysOfWeek (new) and dayOfWeek (old) for backward compatibility
    const daysOfWeek = entry.daysOfWeek && entry.daysOfWeek.length > 0 
      ? entry.daysOfWeek 
      : (dayOfWeek !== undefined ? [dayOfWeek] : undefined);
    
    const prepared: ScheduleEntry = {
      id,
      title: entry.title.trim(),
      category: entry.category,
      recurrence: entry.recurrence,
      startTime: entry.startTime,
      endTime: entry.endTime,
      dayOfWeek,
      daysOfWeek,
      oneTimeDate: entry.oneTimeDate,
      effectiveFrom: entry.effectiveFrom,
      effectiveTo: entry.effectiveTo,
      notes: entry.notes,
      targetFiscalYear: ensureFiscalYear(entry),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const next = [...schedules, prepared];
    await persist(next);
    return prepared;
  }, [persist, schedules]);

  const updateSchedule = useCallback(async (id: string, updates: ScheduleDraft) => {
    const now = new Date();
    let updatedEntry: ScheduleEntry | null = null;
    const next = schedules.map(existing => {
      if (existing.id !== id) {
        return existing;
      }
      const dayOfWeek = normaliseDayOfWeek(
        updates.dayOfWeek,
        updates.oneTimeDate
          ? (() => {
              const jsDay = parseDateOnly(updates.oneTimeDate)?.getDay();
              return typeof jsDay === 'number' ? ((jsDay + 6) % 7) : existing.dayOfWeek;
            })()
          : existing.dayOfWeek,
      );
      
      // Support both daysOfWeek (new) and dayOfWeek (old)
      const daysOfWeek = updates.daysOfWeek && updates.daysOfWeek.length > 0
        ? updates.daysOfWeek
        : (dayOfWeek !== undefined ? [dayOfWeek] : existing.daysOfWeek);
      
      updatedEntry = {
        ...existing,
        title: updates.title.trim(),
        category: updates.category,
        recurrence: updates.recurrence,
        startTime: updates.startTime,
        endTime: updates.endTime,
        dayOfWeek,
        daysOfWeek,
        oneTimeDate: updates.oneTimeDate,
        effectiveFrom: updates.effectiveFrom,
        effectiveTo: updates.effectiveTo,
        notes: updates.notes,
        targetFiscalYear: ensureFiscalYear(updates) ?? existing.targetFiscalYear,
        updatedAt: now.toISOString(),
      };
      if (!updatedEntry.targetFiscalYear) {
        updatedEntry.targetFiscalYear = ensureFiscalYear(updatedEntry) ?? updatedEntry.targetFiscalYear;
      }
      return updatedEntry;
    });
    await persist(next);
    return updatedEntry;
  }, [persist, schedules]);

  const removeSchedule = useCallback(async (id: string) => {
    const next = schedules.filter(entry => entry.id !== id);
    await persist(next);
  }, [persist, schedules]);

  const getSchedulesForContext = useCallback(({ fiscalYear, semester, dayOfWeek }: GetSchedulesForContextParams) => {
    if (schedules.length === 0) {
      return [];
    }

    const semesterRange = getSemesterRange(fiscalYear, semester);

    const resolved: ResolvedScheduleInstance[] = [];

    schedules.forEach(entry => {
      // Support both daysOfWeek (new) and dayOfWeek (old)
      const entryDays = entry.daysOfWeek && entry.daysOfWeek.length > 0
        ? entry.daysOfWeek
        : (typeof entry.dayOfWeek === 'number' ? [entry.dayOfWeek] : []);
      
      const matchesDay = entryDays.includes(dayOfWeek);
      const effectiveRange = intersectWithSemester(semesterRange, entry.effectiveFrom, entry.effectiveTo);

      switch (entry.recurrence) {
        case 'once': {
          if (!entry.oneTimeDate) {
            break;
          }
          const occurrence = parseDateOnly(entry.oneTimeDate);
          if (!occurrence) {
            break;
          }
          const occurrenceFiscalYear = getFiscalYear(occurrence);
          const occurrenceSemester = computeDefaultSemester(occurrence);
          const jsDay = occurrence.getDay();
          const appDay = (jsDay + 6) % 7;
          if (
            occurrenceFiscalYear === fiscalYear &&
            occurrenceSemester === semester &&
            appDay === dayOfWeek
          ) {
            resolved.push(buildResolvedInstance(entry, occurrence));
          }
          break;
        }
        case 'weekly': {
          if (!matchesDay) {
            break;
          }
          const occurrence = shouldIncludeByDateRange(effectiveRange, dayOfWeek);
          if (occurrence) {
            resolved.push(buildResolvedInstance(entry, occurrence));
          }
          break;
        }
        case 'fiscalYear': {
          if ((entry.targetFiscalYear ?? getFiscalYear()) !== fiscalYear) {
            break;
          }
          if (!matchesDay) {
            break;
          }
          const occurrence = shouldIncludeByDateRange(effectiveRange, dayOfWeek);
          if (occurrence) {
            resolved.push(buildResolvedInstance(entry, occurrence));
          }
          break;
        }
        case 'semesterFirst':
        case 'semesterSecond': {
          const required = entry.recurrence === 'semesterFirst' ? '0' : '1';
          if (required !== semester) {
            break;
          }
          if ((entry.targetFiscalYear ?? getFiscalYear()) !== fiscalYear) {
            break;
          }
          if (!matchesDay) {
            break;
          }
          const occurrence = shouldIncludeByDateRange(effectiveRange, dayOfWeek);
          if (occurrence) {
            resolved.push(buildResolvedInstance(entry, occurrence));
          }
          break;
        }
        case 'customRange': {
          if (!matchesDay) {
            break;
          }
          const occurrence = shouldIncludeByDateRange(effectiveRange, dayOfWeek);
          if (occurrence) {
            resolved.push(buildResolvedInstance(entry, occurrence));
          }
          break;
        }
        default:
          break;
      }
    });

    return resolved.sort((a, b) => {
      if (a.startTime === b.startTime) {
        return a.endTime.localeCompare(b.endTime);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [schedules]);

  const value = useMemo<ScheduleContextValue>(() => ({
    schedules,
    isLoading,
    addSchedule,
    updateSchedule,
    removeSchedule,
    getSchedulesForContext,
  }), [schedules, isLoading, addSchedule, updateSchedule, removeSchedule, getSchedulesForContext]);

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedules() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedulesはScheduleProvider内で使用してください');
  }
  return context;
}
