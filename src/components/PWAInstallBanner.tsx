import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, IconSize } from '@/constants/Design';
import Icon from '@/components/ui/AppIcon';

export function PWAInstallBanner() {
  const { showBanner, isInstallable, isIosManualInstall, promptInstall, dismissBanner } = usePwaInstallPrompt();
  const colorScheme = useColorScheme() ?? 'light';
  const accentColorValue = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: Colors.light.card, dark: Colors.dark.card }, 'background');
  const borderColor = useThemeColor({ light: Colors.light.border, dark: Colors.dark.border }, 'text');
  const [installing, setInstalling] = useState(false);

  const handleInstall = useCallback(async () => {
    if (!isInstallable || installing) {
      return;
    }
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  }, [installing, isInstallable, promptInstall]);

  if (!showBanner) {
    return null;
  }

  return (
    <Card
      elevation="sm"
      style={[styles.pwaBanner, { backgroundColor: cardBackground, borderColor }]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="アプリをインストール"
      accessibilityHint={isInstallable 
        ? 'インストールするとブラウザを開かずに利用できます' 
        : 'Safariの共有メニューから「ホーム画面に追加」を選択してください'}
    >
      <View style={styles.pwaHeaderRow} accessibilityElementsHidden={true}>
        <View style={[styles.pwaIconCircle, { backgroundColor: accentColorValue + '1A' }]}>
          <Icon name="download-circle" size={IconSize.md} color={accentColorValue} accessibilityElementsHidden={true} />
        </View>
        <View style={styles.pwaHeaderTexts}>
          <ThemedText type="defaultSemiBold" style={[styles.pwaTitle, { color: textColor }]}>
            ホーム画面に追加できます
          </ThemedText>
          <ThemedText type="small" style={[styles.pwaSubtitle, { color: Colors[colorScheme].icon }]}>
            {isInstallable
              ? 'インストールするとブラウザを開かずに利用できます。'
              : 'Safariの共有メニューから「ホーム画面に追加」を選択してください。'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.pwaActionsRow}>
        {isInstallable ? (
          <DragSafeTouchableOpacity
            style={[styles.pwaPrimaryButton, { backgroundColor: accentColorValue, opacity: installing ? 0.7 : 1 }]}
            onPress={handleInstall}
            disabled={installing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="インストール"
            accessibilityState={{ disabled: installing }}
            accessibilityHint={installing ? '処理中です' : 'アプリをインストールします'}
          >
            <ThemedText style={styles.pwaPrimaryButtonText}>
              {installing ? '処理中…' : 'インストール'}
            </ThemedText>
          </DragSafeTouchableOpacity>
        ) : (
          isIosManualInstall && (
            <View style={[styles.pwaHintBox, { borderColor: Colors[colorScheme].icon + '40' }]}>
              <ThemedText type="small" style={[styles.pwaHintText, { color: Colors[colorScheme].icon }]} numberOfLines={2}>
                画面下部の共有アイコンから「ホーム画面に追加」を選択してください。
              </ThemedText>
            </View>
          )
        )}

        <DragSafeTouchableOpacity 
          style={styles.pwaDismissButton} 
          onPress={dismissBanner}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="後で"
          accessibilityHint="このお知らせを閉じます"
        >
          <ThemedText type="small" style={[styles.pwaDismissText, { color: Colors[colorScheme].icon }]}>
            後で
          </ThemedText>
        </DragSafeTouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  pwaBanner: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  pwaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pwaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  pwaHeaderTexts: {
    flex: 1,
  },
  pwaTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  pwaSubtitle: {
    lineHeight: 18,
  },
  pwaActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  pwaPrimaryButton: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwaPrimaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pwaHintBox: {
    flex: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: Spacing.sm,
  },
  pwaHintText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pwaDismissButton: {
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  pwaDismissText: {
    fontWeight: '600',
  },
});