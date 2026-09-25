// AsyncStorage's existing browser keys also allow a safe rollback to Expo.
const prefix = '@react-native-async-storage/async-storage:';
export default {
  async getItem(key: string) { return typeof localStorage === 'undefined' ? null : localStorage.getItem(prefix + key) ?? localStorage.getItem(key); },
  async setItem(key: string, value: string) { localStorage.setItem(prefix + key, value); },
  async removeItem(key: string) { localStorage.removeItem(prefix + key); localStorage.removeItem(key); },
  async clear() { for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key); },
  async getAllKeys() { return Object.keys(localStorage).filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length)); },
  async multiRemove(keys: string[]) { for (const key of keys) { localStorage.removeItem(prefix + key); localStorage.removeItem(key); } },
};
