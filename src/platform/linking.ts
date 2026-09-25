export const createURL = (path: string) => new URL(path, location.origin).href;
