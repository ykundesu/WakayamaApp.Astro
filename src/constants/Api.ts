const raw = import.meta.env.PUBLIC_API_BASE_URL || 'https://wakosen-app-api.yoking.dev';
export const API_BASE_URL = raw.replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1';
export const FIGURE_API_BASE_URL = `${API_BASE_URL}/school-rules/`;
export const apiUrl = (path: string) => API_BASE_URL + (path.startsWith('/') ? path : '/' + path);
