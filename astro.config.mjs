import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
const local = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://wakosen-app.yoking.dev', output: 'static',
  vite: {
    define: { __DEV__: 'false', 'process.env.EXPO_OS': '"web"' },
    resolve: { alias: [
      { find: '@', replacement: local('./src') },
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: 'react-native-reanimated', replacement: local('./src/platform/reanimated.ts') },
      { find: /^expo-router(?:\/.*)?$/, replacement: local('./src/platform/router.tsx') },
      { find: '@react-native-async-storage/async-storage', replacement: local('./src/platform/storage.ts') },
      { find: /^(?:@react-navigation\/.*|react-native-safe-area-context)$/, replacement: local('./src/platform/navigation.tsx') },
      { find: /^@expo\/vector-icons\/.*$/, replacement: local('./src/components/ui/AppIcon.tsx') },
      { find: 'expo-clipboard', replacement: local('./src/platform/clipboard.ts') },
      { find: 'expo-linking', replacement: local('./src/platform/linking.ts') },
      { find: '@react-native-community/datetimepicker', replacement: local('./src/platform/native-only.tsx') },
    ] },
    ssr: { noExternal: ['react-native-web'] }, build: { assetsInlineLimit: 0 },
  },
});
