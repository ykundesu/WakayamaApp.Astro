export const APP_NAME = 'WakayamaApp';

export function withAppName(title?: string): string {
  if (!title) return APP_NAME;
  return `${title} - ${APP_NAME}`;
}


