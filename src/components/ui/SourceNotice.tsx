import { Linking, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Design';
import { useColorScheme } from '@/hooks/useColorScheme';

type SourceNoticeProps = {
  sourceUrl: string;
  style?: StyleProp<ViewStyle>;
};

const NOTICE_TEXT = 'この情報は、和歌山高専公式サイトから自動で抽出したものです。正確な情報については公式サイトをご確認ください。';

export function SourceNotice({ sourceUrl, style }: SourceNoticeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const mutedColor = Colors[colorScheme].icon;
  const linkColor = Colors[colorScheme].accent;

  const openSource = () => {
    void Linking.openURL(sourceUrl);
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: Colors[colorScheme].border,
        },
        style,
      ]}
    >
      <ThemedText style={[styles.noticeText, { color: mutedColor }]}>
        {NOTICE_TEXT}
      </ThemedText>
      <View style={styles.sourceRow}>
        <ThemedText style={[styles.sourceLabel, { color: mutedColor }]}>
          情報元:
        </ThemedText>
        <Pressable
          onPress={openSource}
          accessibilityRole="link"
          accessibilityLabel={`情報元を開く: ${sourceUrl}`}
          style={({ pressed }) => [styles.linkPressable, { opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText style={[styles.sourceUrl, { color: linkColor }]}>
            {sourceUrl}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.82,
    textAlign: 'center',
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: Spacing.xs / 2,
  },
  sourceLabel: {
    marginRight: Spacing.xs / 2,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.82,
    textAlign: 'center',
  },
  linkPressable: {
    flexShrink: 1,
  },
  sourceUrl: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
