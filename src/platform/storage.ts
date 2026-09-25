// AsyncStorage's existing browser keys also allow a safe rollback to Expo.
const prefix = '@react-native-async-storage/async-storage:';
export default {
  async getItem(key: string) { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key) ?? localStorage.getItem(prefix + key); },
  async setItem(key: string, value: string) { localStorage.setItem(key, value); localStorage.removeItem(prefix + key); },
  async removeItem(key: string) { localStorage.removeItem(prefix + key); localStorage.removeItem(key); },
  async clear() { for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key); },
  async getAllKeys() { return [...new Set(Object.keys(localStorage).map(k => k.startsWith(prefix) ? k.slice(prefix.length) : k))]; },
  async multiRemove(keys: string[]) { for (const key of keys) { localStorage.removeItem(prefix + key); localStorage.removeItem(key); } },
};
