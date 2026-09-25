const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function normalizeEventDateToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;

  const numericMatch = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  const jpMatch = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  const match = numericMatch ?? jpMatch;
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

export function resolveEventDate(academicYear: number, dateToken: string): Date | null {
  const normalized = normalizeEventDateToken(dateToken);
  if (!normalized) return null;
  const [monthStr, dayStr] = normalized.split('/');
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  const year = month >= 4 ? academicYear : academicYear + 1;
  const resolved = new Date(year, month - 1, day);
  if (Number.isNaN(resolved.getTime())) return null;
  return resolved;
}

export function formatEventDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return `${month}/${day}(${weekday})`;
}

export function getGradeLabel(grade: number | null | undefined): string {
  if (typeof grade !== 'number') return '全学年';
  if (grade < 1 || grade > 5) return '全学年';
  return `${grade}年`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
