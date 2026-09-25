import React from 'react';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Design';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_VERSION } from '@/constants/AppInfo';
import { CHANGELOG } from '@/constants/Changelog';

export default function ChangelogScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const { actualColorScheme } = useSettings();

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title: '変更履歴' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card elevation="sm" style={styles.currentVersionCard}>
          <ThemedText type="subtitle" style={{ color: textColor }}>
            現在のバージョン
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={{ color: Colors[actualColorScheme].accent, marginTop: 6 }}>
            {APP_VERSION}
          </ThemedText>
        </Card>

        {CHANGELOG.map((entry) => (
          <Card key={entry.version} elevation="sm" style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                v{entry.version}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors[actualColorScheme].icon }}>
                {entry.date}
              </ThemedText>
            </View>

            {entry.highlights && entry.highlights.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="small" style={[styles.sectionTitle, { color: Colors[actualColorScheme].icon }]}>主な変更</ThemedText>
                {entry.highlights.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: Colors[actualColorScheme].accent }]} />
                    <ThemedText style={{ color: textColor }}>{item}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <ThemedText type="small" style={[styles.sectionTitle, { color: Colors[actualColorScheme].icon }]}>詳細</ThemedText>
              {entry.changes.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: Colors[actualColorScheme].accent }]} />
                  <ThemedText style={{ color: textColor }}>{item}</ThemedText>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  currentVersionCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: 4,
  },
  entryCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
});
