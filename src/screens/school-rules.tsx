import React, { useCallback, useMemo, useState } from 'react';
import { Stack, router } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from '@/components/ui/AppIcon';
import Animated from 'react-native-reanimated';
import { useTabTransition } from '@/hooks/useTabTransition';
import { useSchoolRules } from '@/hooks/useSchoolRules';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { Spacing, Radius } from '@/constants/Design';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { RuleSearchResult, SchoolRule, SchoolRuleChapter } from '@/types/schoolRules';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function SchoolRulesScreen() {
  const { chapters, getRulesByChapter, searchRules, loading, error, refetch } = useSchoolRules();
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';
  const animatedStyle = useTabTransition();

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => a.order - b.order);
  }, [chapters]);

  const searchResults = useMemo<RuleSearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    return searchRules(searchQuery);
  }, [searchQuery, searchRules]);

  const handleSelectRule = useCallback((ruleId: string, chapterId: string) => {
    router.push({
      pathname: '/(tabs)/school-rules/[ruleId]',
      params: { ruleId, chapterId },
    });
  }, []);

  const toggleChapter = useCallback(
    (chapterId: string) => {
      setOpenChapterId((prev) => (prev === chapterId ? null : chapterId));
    },
    [setOpenChapterId],
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const isSearchActive = searchQuery.trim().length > 0;
  const accentColor = Colors[colorScheme].accent;
  const borderColor = Colors[colorScheme].border;
  const tintColor = Colors[colorScheme].icon;

  return (
    <AnimatedView style={[styles.container, animatedStyle]}>
      <Stack.Screen
        options={{
          title: '学則',
          headerLargeTitle: true,
        }}
      />
      <ThemedView style={styles.inner}>
        <Card elevation="md" style={styles.searchCard}>
          <View style={styles.searchInputContainer}>
            <Icon name="magnify" size={22} color={tintColor} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="規則名や条文で検索"
              placeholderTextColor={Colors[colorScheme].icon}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <DragSafeTouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color={tintColor} />
              </DragSafeTouchableOpacity>
            )}
          </View>
        </Card>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
              colors={[accentColor]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* 免責表記 */}
          <Card elevation="none" style={styles.disclaimerCard}>
            <Icon name="information-outline" size={18} color={tintColor} />
            <ThemedText type="small" style={styles.disclaimerText}>
              免責: 記載されている情報は最新でない、または不正確な場合があります。最新の情報は和歌山高専公式サイトをご覧ください。
            </ThemedText>
          </Card>
          <View style={styles.disclaimerSpacing} />
          {loading && !refreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <ThemedText style={styles.loadingText}>学則を読み込んでいます…</ThemedText>
            </View>
          )}

          {error && !loading && (
            <Card elevation="md" style={[styles.feedbackCard, { borderColor }]}>
              <Icon name="alert-circle-outline" size={32} color={accentColor} />
              <ThemedText style={styles.feedbackText}>{error}</ThemedText>
              <DragSafeTouchableOpacity style={styles.retryButton} onPress={refetch}>
                <ThemedText style={styles.retryButtonText}>再読み込み</ThemedText>
              </DragSafeTouchableOpacity>
            </Card>
          )}

          {!loading && !error && isSearchActive && (
            <SearchResults
              results={searchResults}
              onSelect={handleSelectRule}
              tintColor={tintColor}
              accentColor={accentColor}
            />
          )}

          {!loading && !error && !isSearchActive && (
            <ChapterList
              chapters={sortedChapters}
              openChapterId={openChapterId}
              onToggleChapter={toggleChapter}
              onSelectRule={handleSelectRule}
              getRulesByChapter={getRulesByChapter}
              tintColor={tintColor}
              accentColor={accentColor}
            />
          )}
        </ScrollView>
      </ThemedView>
    </AnimatedView>
  );
}

type ChapterListProps = {
  chapters: SchoolRuleChapter[];
  openChapterId: string | null;
  onToggleChapter: (chapterId: string) => void;
  onSelectRule: (ruleId: string, chapterId: string) => void;
  getRulesByChapter: (chapterId: string) => SchoolRule[];
  tintColor: string;
  accentColor: string;
};

function ChapterList({
  chapters,
  openChapterId,
  onToggleChapter,
  onSelectRule,
  getRulesByChapter,
  tintColor,
  accentColor,
}: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <Card elevation="md" style={styles.feedbackCard}>
        <Icon name="book-off" size={32} color={tintColor} />
        <ThemedText style={styles.feedbackText}>表示できる章がありません</ThemedText>
      </Card>
    );
  }

  return (
    <View style={styles.chapterList}>
      {chapters.map((chapter) => {
        const rules = getRulesByChapter(chapter.id);
        const isOpen = openChapterId === chapter.id;
        return (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            rules={rules}
            isOpen={isOpen}
            onToggleChapter={onToggleChapter}
            onSelectRule={onSelectRule}
            tintColor={tintColor}
            accentColor={accentColor}
          />
        );
      })}
    </View>
  );
}

type ChapterCardProps = {
  chapter: SchoolRuleChapter;
  rules: SchoolRule[];
  isOpen: boolean;
  onToggleChapter: (chapterId: string) => void;
  onSelectRule: (ruleId: string, chapterId: string) => void;
  tintColor: string;
  accentColor: string;
};

function ChapterCard({
  chapter,
  rules,
  isOpen,
  onToggleChapter,
  onSelectRule,
  tintColor,
  accentColor,
}: ChapterCardProps) {
  return (
    <View>
      <Card elevation="md" style={styles.chapterCard}>
        <DragSafeTouchableOpacity
          onPress={() => onToggleChapter(chapter.id)}
          style={styles.chapterHeader}
        >
          <View style={styles.chapterHeaderText}>
            <ThemedText type="defaultSemiBold" style={styles.chapterTitle}>
              {chapter.title}
            </ThemedText>
            <ThemedText type="small" style={styles.chapterCount}>
              {rules.length}件の規則
            </ThemedText>
          </View>
          <View>
            <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color={tintColor} />
          </View>
        </DragSafeTouchableOpacity>
        {isOpen && (
          <View style={styles.ruleList}>
            {rules.map((rule) => (
              <View key={rule.id} style={styles.ruleRowContainer}>
                <DragSafeTouchableOpacity
                  style={styles.ruleRow}
                  onPress={() => onSelectRule(rule.id, chapter.id)}
                >
                  <View style={styles.ruleIcon}>
                    <Icon name="file-document-outline" size={18} color={accentColor} />
                  </View>
                  <View style={styles.ruleContent}>
                    <ThemedText style={styles.ruleTitle}>{rule.title}</ThemedText>
                    {rule.summary ? (
                      <ThemedText numberOfLines={2} style={styles.ruleSummary}>
                        {rule.summary}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Icon name="chevron-right" size={18} color={tintColor} />
                </DragSafeTouchableOpacity>
              </View>
            ))}
            {rules.length === 0 && (
              <ThemedText style={styles.emptyRuleText}>規則が登録されていません</ThemedText>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

type SearchResultsProps = {
  results: RuleSearchResult[];
  onSelect: (ruleId: string, chapterId: string) => void;
  tintColor: string;
  accentColor: string;
};

function SearchResults({ results, onSelect, tintColor, accentColor }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <Card elevation="md" style={styles.feedbackCard}>
        <Icon name="text-search" size={32} color={tintColor} />
        <ThemedText style={styles.feedbackText}>該当する規則が見つかりませんでした。</ThemedText>
      </Card>
    );
  }

  return (
    <View style={styles.searchResults}>
      {results.map((result) => (
        <Card key={`${result.ruleId}-${result.matchType}`} elevation="sm" style={styles.resultCard}>
          <DragSafeTouchableOpacity
            onPress={() => onSelect(result.ruleId, result.chapterId)}
            style={styles.resultRow}
          >
            <View style={styles.resultIcon}>
              <Icon
                name={
                  result.matchType === 'article'
                    ? 'format-list-text'
                    : result.matchType === 'summary'
                    ? 'text-box-outline'
                    : 'book-open-page-variant'
                }
                size={20}
                color={accentColor}
              />
            </View>
            <View style={styles.resultContent}>
              <ThemedText style={styles.resultTitle}>{result.title}</ThemedText>
              {result.articleLabel ? (
                <ThemedText type="small" style={styles.resultMeta}>
                  {result.articleLabel}
                </ThemedText>
              ) : null}
              {result.matchedText ? (
                <ThemedText numberOfLines={2} style={styles.resultSnippet}>
                  {result.matchedText}
                </ThemedText>
              ) : result.summary ? (
                <ThemedText numberOfLines={2} style={styles.resultSnippet}>
                  {result.summary}
                </ThemedText>
              ) : null}
            </View>
            <Icon name="chevron-right" size={18} color={tintColor} />
          </DragSafeTouchableOpacity>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  searchCard: {
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  searchIcon: {
    marginRight: Spacing.xs / 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl * 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  feedbackCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  feedbackText: {
    textAlign: 'center',
    fontSize: 15,
  },
  retryButton: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  chapterList: {
    gap: Spacing.md,
  },
  chapterCard: {
    gap: Spacing.sm,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterHeaderText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  chapterTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  chapterCount: {
    opacity: 0.7,
  },
  ruleList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  ruleRowContainer: {
    // Container for animated rule row
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  ruleIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleContent: {
    flex: 1,
    gap: 2,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ruleSummary: {
    fontSize: 13,
    opacity: 0.75,
  },
  emptyRuleText: {
    opacity: 0.6,
    paddingVertical: Spacing.xs,
  },
  searchResults: {
    gap: Spacing.sm,
  },
  resultCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  resultIcon: {
    width: 28,
    alignItems: 'center',
    marginTop: 2,
  },
  resultContent: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultMeta: {
    fontSize: 12,
    opacity: 0.7,
  },
  resultSnippet: {
    fontSize: 13,
    opacity: 0.75,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  disclaimerText: {
    flex: 1,
    opacity: 0.7,
    lineHeight: 18,
  },
  disclaimerSpacing: {
    height: Spacing.md,
  },
});
