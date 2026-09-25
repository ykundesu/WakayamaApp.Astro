import { WEEKDAY_LABELS } from './classes';

export type ScheduleCategory = 'class' | 'club' | 'other';

export const SCHEDULE_CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  class: '授業',
  club: 'クラブ',
  other: 'その他',
};

export const SCHEDULE_CATEGORY_OPTIONS: ScheduleCategory[] = ['class', 'club', 'other'];

export type ScheduleRecurrence =
  | 'once'
  | 'weekly'
  | 'fiscalYear'
  | 'semesterFirst'
  | 'semesterSecond'
  | 'customRange';

export const SCHEDULE_RECURRENCE_LABELS: Record<ScheduleRecurrence, string> = {
  once: '一度のみ',
  weekly: '毎週',
  fiscalYear: '今年度のみ',
  semesterFirst: '前期のみ',
  semesterSecond: '後期のみ',
  customRange: '期間指定',
};

export const SCHEDULE_RECURRENCE_OPTIONS: ScheduleRecurrence[] = [
  'weekly',
  'fiscalYear',
  'semesterFirst',
  'semesterSecond',
  'customRange',
  'once',
];

export interface ScheduleEntry {
  id: string;
  title: string;
  category: ScheduleCategory;
  recurrence: ScheduleRecurrence;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  dayOfWeek?: number; // 0 = Monday (for backward compatibility)
  daysOfWeek?: number[]; // 0 = Monday, for multiple days
  oneTimeDate?: string; // YYYY-MM-DD
  effectiveFrom?: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD
  notes?: string;
  targetFiscalYear?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDraft {
  id?: string;
  title: string;
  category: ScheduleCategory;
  recurrence: ScheduleRecurrence;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
  daysOfWeek?: number[]; // For multiple day selection
  oneTimeDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
  targetFiscalYear?: number;
}

export interface ResolvedScheduleInstance {
  entryId: string;
  title: string;
  category: ScheduleCategory;
  recurrence: ScheduleRecurrence;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  occurrenceDate: string; // YYYY-MM-DD
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
  targetFiscalYear?: number;
}

export interface GetSchedulesForContextParams {
  fiscalYear: number;
  semester: '0' | '1';
  dayOfWeek: number;
}

export type ScheduleFormValues = ScheduleDraft;

export const WEEKDAY_PICKER_ITEMS = WEEKDAY_LABELS.map((label, index) => ({
  label,
  value: index,
}));
