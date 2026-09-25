import React, { useCallback, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleProp,
  StyleSheet,

  TouchableWithoutFeedback,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Icon from '@/components/ui/AppIcon';
import Animated from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as ExpoLinking from 'expo-linking';
import { useSchoolRules } from '@/hooks/useSchoolRules';
import { useTabTransition } from '@/hooks/useTabTransition';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { DragSafeTouchableOpacity } from '@/components/ui/DragSafePressable';
import { Spacing, Radius } from '@/constants/Design';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SchoolRule, SchoolRuleArticle, SchoolRuleSection } from '@/types/schoolRules';
import Markdown from '@/components/ui/Markdown';

const ToastAndroid = {show: (_text: string, _duration: number) => {}, SHORT: 0};
const AnimatedView = Animated.createAnimatedComponent(View);

type Params = {
  ruleId?: string;
  chapterId?: string;
  sectionId?: string;
  articleId?: string;
};

export default function SchoolRuleDetailsScreen() {
  const params = useLocalSearchParams<Params>();
  const {
    ruleId: ruleIdParam,
    chapterId: chapterIdParam,
    sectionId: sectionIdParam,
    articleId: articleIdParam,
  } = params;
  const {
    getRuleById,

    getChapterById,
    getRulesByChapter,
    loading,
    error,
    refetch,
    payload,
    ensureRuleLoaded,
  } = useSchoolRules();
  const animatedStyle = useTabTransition();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const isSidebarLayout = width >= 960;
  const scrollRef = React.useRef<ScrollView | null>(null);
  const sectionPositionsRef = React.useRef<Record<string, number>>({});
  const sectionContainerOffsetRef = React.useRef(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const articlePositionsRef = React.useRef<Record<string, { sectionId: string; y: number }>>({});
  const [highlightedArticleId, setHighlightedArticleId] = useState<string | null>(null);

  const rule = useMemo(() => getRuleById(ruleIdParam), [getRuleById, ruleIdParam]);
  const chapter = useMemo(() => {
    if (rule) {
      return getChapterById(rule.chapterId);
    }
    return getChapterById(chapterIdParam);
  }, [chapterIdParam, getChapterById, rule]);

  const relatedRules = useMemo(() => {
    if (!chapter || !rule) return [];
    return getRulesByChapter(chapter.id).filter((item) => item.id !== rule.id);
  }, [chapter, getRulesByChapter, rule]);

  const accentColor = Colors[colorScheme].accent;
  const tintColor = Colors[colorScheme].icon;
  const sortedSections = useMemo(() => {
    if (!rule?.sections || rule.sections.length === 0) {
      return [] as SchoolRuleSection[];
    }
    return [...rule.sections].sort((a, b) => a.order - b.order);
  }, [rule?.sections]);
  const sectionScrollOffset = Spacing.lg * 1.5;

  const findSectionIdByArticle = useCallback(
    (targetArticleId: string | null) => {
      if (!targetArticleId) return null;
      for (const section of sortedSections) {
        if (section.articles.some((item) => item.id === targetArticleId)) {
          return section.id;
        }
      }
      return null;
    },
    [sortedSections],
  );

  const computeSectionAnchor = useCallback(
    (sectionId: string) => {
      const sectionY = sectionPositionsRef.current[sectionId];
      if (typeof sectionY !== 'number') return null;
      return Math.max(0, sectionContainerOffsetRef.current + sectionY - sectionScrollOffset);
    },
    [sectionScrollOffset],
  );

  const computeArticleAnchor = useCallback(
    (sectionId: string, articleId: string) => {
      const sectionY = sectionPositionsRef.current[sectionId];
      const articleData = articlePositionsRef.current[articleId];
      if (typeof sectionY !== 'number' || !articleData) return null;
      return Math.max(
        0,
        sectionContainerOffsetRef.current + sectionY + articleData.y - sectionScrollOffset,
      );
    },
    [sectionScrollOffset],
  );

  const scrollToSection = useCallback(
    (
      sectionId: string,
      { updateParams = true, animate = true }: { updateParams?: boolean; animate?: boolean } = {},
    ) => {
      if (!sectionId) return false;
      setSelectedSectionId(sectionId);
      setHighlightedArticleId(null);
      const anchor = computeSectionAnchor(sectionId);
      if (anchor != null && scrollRef.current) {
        scrollRef.current.scrollTo({ y: anchor, animated: animate });
      }
      if (updateParams) {
        router.setParams({
          chapterId: chapter?.id ?? chapterIdParam ?? '',
          sectionId,
          articleId: '',
        });
      }
      return anchor != null;
    },
    [chapter?.id, chapterIdParam, computeSectionAnchor, router],
  );

  const scrollToArticle = useCallback(
    (
      sectionId: string,
      articleId: string,
      { updateParams = true, animate = true }: { updateParams?: boolean; animate?: boolean } = {},
    ) => {
      if (!sectionId || !articleId) return false;
      setSelectedSectionId(sectionId);
      setHighlightedArticleId(articleId);
      const anchor =
        computeArticleAnchor(sectionId, articleId) ?? computeSectionAnchor(sectionId);
      if (anchor != null && scrollRef.current) {
        scrollRef.current.scrollTo({ y: anchor, animated: animate });
      }
      if (updateParams) {
        router.setParams({
          chapterId: chapter?.id ?? chapterIdParam ?? '',
          sectionId,
          articleId,
        });
      }
      return anchor != null;
    },
    [chapter?.id, chapterIdParam, computeArticleAnchor, computeSectionAnchor, router],
  );

  const scheduleScrollToTarget = useCallback(
    (sectionId: string | null, articleId: string | null) => {
      if (!sectionId) return;
      let attempts = 0;
      const maxAttempts = 6;
      const attempt = () => {
        const success = articleId
          ? scrollToArticle(sectionId, articleId, { updateParams: false })
          : scrollToSection(sectionId, { updateParams: false });
        if (success || attempts >= maxAttempts) {
          return;
        }
        attempts += 1;
        requestAnimationFrame(attempt);
      };
      attempt();
    },
    [scrollToArticle, scrollToSection],
  );

  const handleSectionsContainerLayout = useCallback((offsetY: number) => {
    sectionContainerOffsetRef.current = offsetY;
  }, []);

  const handleRecordSectionPosition = useCallback(
    (sectionId: string, layoutY: number) => {
      sectionPositionsRef.current[sectionId] = layoutY;
      if (articleIdParam) {
        const relatedSection = findSectionIdByArticle(articleIdParam);
        if (relatedSection === sectionId) {
          scheduleScrollToTarget(sectionId, articleIdParam);
        }
        return;
      }
      if (sectionIdParam === sectionId) {
        scheduleScrollToTarget(sectionId, null);
      }
    },
    [articleIdParam, findSectionIdByArticle, scheduleScrollToTarget, sectionIdParam],
  );

  const handleRecordArticlePosition = useCallback(
    (sectionId: string, articleId: string, layoutY: number) => {
      articlePositionsRef.current[articleId] = { sectionId, y: layoutY };
      if (articleIdParam === articleId) {
        scheduleScrollToTarget(sectionId, articleId);
      }
    },
    [articleIdParam, scheduleScrollToTarget],
  );

  const handleSelectSection = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId);
    },
    [scrollToSection],
  );

  React.useEffect(() => {
    sectionPositionsRef.current = {};
    articlePositionsRef.current = {};
    sectionContainerOffsetRef.current = 0;
    setSelectedSectionId(null);
    setHighlightedArticleId(null);
  }, [rule?.id]);

  React.useEffect(() => {
    if (sectionIdParam && sortedSections.some((section) => section.id === sectionIdParam)) {
      setSelectedSectionId(sectionIdParam);
      return;
    }
    if (sortedSections.length > 0) {
      setSelectedSectionId((current) => current ?? sortedSections[0].id);
    } else {
      setSelectedSectionId(null);
    }
  }, [sectionIdParam, sortedSections]);

  React.useEffect(() => {
    if (articleIdParam) {
      const targetSection = findSectionIdByArticle(articleIdParam) ?? sectionIdParam ?? sortedSections[0]?.id ?? null;
      if (targetSection) {
        scheduleScrollToTarget(targetSection, articleIdParam);
      }
      return;
    }
    if (sectionIdParam) {
      scheduleScrollToTarget(sectionIdParam, null);
    }
  }, [articleIdParam, findSectionIdByArticle, scheduleScrollToTarget, sectionIdParam, sortedSections]);

  const showToast = useCallback((message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  }, []);

  const formatArticle = useCallback((article: SchoolRuleArticle) => {
    const label = article.label ? `${article.label} ` : '';
    const notes = article.notes ? `\n（備考）${article.notes}` : '';
    return `${label}${article.body}${notes}`;
  }, []);

  const formatRuleText = useCallback(
    (target: SchoolRule) => {
      const lines: string[] = [];
      if (chapter?.title) {
        lines.push(chapter.title);
      }
      lines.push(target.title);
      if (target.summary) {
        lines.push(target.summary);
      }

      const appendArticles = (articles: SchoolRuleArticle[]) => {
        articles.forEach((article) => {
          lines.push(formatArticle(article));
        });
      };

      if (target.sections && target.sections.length > 0) {
        const sortedSections = [...target.sections].sort((a, b) => a.order - b.order);
        for (const section of sortedSections) {
          lines.push(section.title);
          if (section.summary) {
            lines.push(section.summary);
          }
          appendArticles(section.articles);
        }
      } else if (target.articles) {
        appendArticles(target.articles);
      }

      if (target.pdfUrl) {
        lines.push('', `PDF: ${target.pdfUrl}`);
      }

      return lines.join('\n');
    },
    [chapter?.title, formatArticle],
  );

  const handleCopyRule = useCallback(async () => {
    if (!rule) return;
    const text = formatRuleText(rule);
    await Clipboard.setStringAsync(text);
    showToast('条文をコピーしました');
  }, [formatRuleText, rule, showToast]);

  const handleShareRule = useCallback(async () => {
    if (!rule) return;
    const text = formatRuleText(rule);
    try {
      await Share.share({
        title: rule.title,
        message: text,
      });
    } catch (error: any) {
      // Web Share APIがサポートされていない場合、クリップボードにコピー
      if (error?.message?.includes('not supported') || Platform.OS === 'web') {
        await Clipboard.setStringAsync(text);
        showToast('共有機能が利用できないため、クリップボードにコピーしました');
      } else {
        showToast('共有に失敗しました');
      }
    }
  }, [formatRuleText, rule, showToast]);

  const baseRuleId = rule?.id ?? ruleIdParam ?? '';

  const buildShareUrl = useCallback(
    (target: { sectionId?: string; articleId?: string } = {}) => {
      if (!baseRuleId) return '';
      const query = new URLSearchParams();
      const resolvedChapterId = chapter?.id ?? chapterIdParam;
      if (resolvedChapterId) {
        query.set('chapterId', resolvedChapterId);
      }
      if (target.sectionId) {
        query.set('sectionId', target.sectionId);
      }
      if (target.articleId) {
        query.set('articleId', target.articleId);
      }
      const path = `/(tabs)/school-rules/${baseRuleId}`;
      const relative = query.toString() ? `${path}?${query.toString()}` : path;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return `${window.location.origin}${relative}`;
      }
      return ExpoLinking.createURL(relative);
    },
    [baseRuleId, chapter?.id, chapterIdParam],
  );

  const handleShareSectionLink = useCallback(
    async (section: SchoolRuleSection) => {
      const url = buildShareUrl({ sectionId: section.id });
      if (!url) {
        showToast('リンクを生成できませんでした');
        return;
      }
      scrollToSection(section.id);
      const shareText = `${section.title}\n${url}`;
      try {
        await Share.share({
          title: `${rule?.title ?? section.title}`,
          message: shareText,
          url,
        });
      } catch (error: any) {
        // Web Share APIがサポートされていない場合、クリップボードにコピー
        if (error?.message?.includes('not supported') || Platform.OS === 'web') {
          await Clipboard.setStringAsync(shareText);
          showToast('共有機能が利用できないため、リンクをクリップボードにコピーしました');
        } else {
          showToast('共有に失敗しました');
        }
      }
    },
    [buildShareUrl, rule?.title, scrollToSection, showToast],
  );

  const handleShareArticleLink = useCallback(
    async (sectionId: string, sectionTitle: string, article: SchoolRuleArticle) => {
      const url = buildShareUrl({ sectionId, articleId: article.id });
      if (!url) {
        showToast('リンクを生成できませんでした');
        return;
      }
      scrollToArticle(sectionId, article.id);
      const headline = article.label && article.label.trim().length > 0 ? article.label : sectionTitle;
      const shareText = `${headline}\n${url}`;
      try {
        await Share.share({
          title: `${rule?.title ?? '学則'} - ${headline}`,
          message: shareText,
          url,
        });
      } catch (error: any) {
        // Web Share APIがサポートされていない場合、クリップボードにコピー
        if (error?.message?.includes('not supported') || Platform.OS === 'web') {
          await Clipboard.setStringAsync(shareText);
          showToast('共有機能が利用できないため、リンクをクリップボードにコピーしました');
        } else {
          showToast('共有に失敗しました');
        }
      }
    },
    [buildShareUrl, rule?.title, scrollToArticle, showToast],
  );

  const handleOpenPdf = useCallback(async () => {
    if (!rule?.pdfUrl) return;
    const supported = await Linking.canOpenURL(rule.pdfUrl);
    if (!supported) {
      showToast('PDFリンクを開けませんでした');
      return;
    }
    await Linking.openURL(rule.pdfUrl);
  }, [rule?.pdfUrl, showToast]);

  const handleSelectRelatedRule = useCallback(
    (targetId: string) => {
      router.replace({
        pathname: '/(tabs)/school-rules/[ruleId]',
        params: { ruleId: targetId, chapterId: chapter?.id ?? '' },
      });
    },
    [chapter?.id],
  );

  // 規則詳細が未ロードの場合は ruleId で詳細をフェッチ
  React.useEffect(() => {
    if (!ruleIdParam) return;
    ensureRuleLoaded(ruleIdParam).catch(() => {
      // 失敗してもここでは握りつぶし、上位の error 表示に委ねる
    });
    // ruleId または rule の変化で再評価
  }, [ruleIdParam, rule, ensureRuleLoaded]);

  // ruleId が変わったときにページトップにスクロール
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [ruleIdParam]);

  // RuleBody 内の空表示を抑制するためのローディング判定
  // - 初期読み込み中(loading)
  // - payload はあるが当該 rule の本文(articles/sections)がまだ未取得
  const isRuleBodyLoading = Boolean(
    loading || (payload && rule && !rule.sections?.length && !rule.articles?.length)
  );

  return (
    <AnimatedView style={[styles.container, animatedStyle]}>
      <Stack.Screen
        options={{
          title: rule?.title ?? '学則',
        }}
      />
      <ThemedView style={styles.inner}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && !payload && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={accentColor} />
              <ThemedText style={styles.feedbackText}>学則を読み込んでいます…</ThemedText>
            </View>
          )}

          {/* 詳細フェッチ中の可能性（payloadはあるがrule本文が未ロード） */}
          {!loading && payload && !rule?.sections?.length && !rule?.articles?.length && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={accentColor} />
              <ThemedText style={styles.feedbackText}>条文を読み込んでいます…</ThemedText>
            </View>
          )}

          {error && !rule && (
            <Card elevation="md" style={styles.feedbackCard}>
              <Icon name="alert-circle-outline" size={32} color={accentColor} />
              <ThemedText style={styles.feedbackText}>{error}</ThemedText>
              <DragSafeTouchableOpacity style={styles.retryButton} onPress={refetch}>
                <ThemedText style={styles.retryButtonText}>再読み込み</ThemedText>
              </DragSafeTouchableOpacity>
            </Card>
          )}

          {!loading && !rule && !error && (
            <Card elevation="md" style={styles.feedbackCard}>
              <Icon name="book-alert" size={32} color={tintColor} />
              <ThemedText style={styles.feedbackText}>
                対象の規則が見つかりませんでした。
              </ThemedText>
            </Card>
          )}

          {rule && (
            <>
              <Card elevation="md" style={styles.headerCard}>
                <View style={[
                  styles.headerIcon,
                  { backgroundColor: accentColor + '18' }
                ]}>
                  <Icon name="book-open-page-variant" size={28} color={accentColor} />
                </View>
                <View style={styles.headerText}>
                  {chapter ? (
                    <ThemedText style={styles.chapterLabel}>{chapter.title}</ThemedText>
                  ) : null}
                  <ThemedText type="title">{rule.title}</ThemedText>
                  {rule.summary ? (
                    <ThemedText style={styles.ruleSummary}>{rule.summary}</ThemedText>
                  ) : null}
                  <View style={styles.metaRow}>
                    {rule.lastUpdated ? (
                      <ThemedText type="small" style={styles.metaText}>
                        更新日: {rule.lastUpdated}
                      </ThemedText>
                    ) : null}
                    {rule.sourcePage ? (
                      <ThemedText type="small" style={styles.metaText}>
                        掲載: {rule.sourcePage}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              </Card>

              {/* 免責表記 */}
              <Card elevation="none" style={styles.disclaimerCard}>
                <Icon name="information-outline" size={18} color={tintColor} />
                <ThemedText type="small" style={styles.disclaimerText}>
                  免責: 記載されている情報は最新でない、または不正確な場合があります。最新の情報は和歌山高専公式サイトをご覧ください。
                </ThemedText>
              </Card>

              <ActionBar
                onCopy={handleCopyRule}
                onShare={handleShareRule}
                onOpenPdf={handleOpenPdf}
                hasPdf={Boolean(rule.pdfUrl)}
                tintColor={tintColor}
                accentColor={accentColor}
              />

              <View style={[styles.ruleLayout, isSidebarLayout && styles.ruleLayoutSidebar]}>
                {isSidebarLayout && sortedSections.length > 0 ? (
                  <SectionNavigator
                    sections={sortedSections}
                    selectedId={selectedSectionId}
                    onSelect={handleSelectSection}
                    accentColor={accentColor}
                    containerStyle={styles.sectionSidebar}
                    forceVertical
                  />
                ) : null}

                <View style={styles.ruleMain}>
                  <RuleBody
                    rule={rule}
                    formatArticle={formatArticle}
                    sections={sortedSections}
                    onSectionsContainerLayout={handleSectionsContainerLayout}
                    onSectionLayout={handleRecordSectionPosition}
                    onArticleLayout={handleRecordArticlePosition}
                    accentColor={accentColor}
                    highlightedArticleId={highlightedArticleId}
                    onShareSection={handleShareSectionLink}
                    onShareArticle={handleShareArticleLink}
                    loading={isRuleBodyLoading}
                  />

                  {relatedRules.length > 0 && (
                    <Card elevation="md" style={styles.relatedCard}>
                      <View style={styles.relatedHeader}>
                        <Icon name="layers-search-outline" size={20} color={accentColor} />
                        <ThemedText type="defaultSemiBold">同じ章の他の規則</ThemedText>
                      </View>
                      <View style={styles.relatedList}>
                        {relatedRules.map((item) => (
                          <DragSafeTouchableOpacity
                            key={item.id}
                            style={styles.relatedItem}
                            onPress={() => handleSelectRelatedRule(item.id)}
                          >
                            <Icon name="chevron-right" size={18} color={tintColor} />
                            <View style={styles.relatedContent}>
                              <ThemedText style={styles.relatedTitle}>{item.title}</ThemedText>
                              {item.summary ? (
                                <ThemedText style={styles.relatedSummary} numberOfLines={2}>
                                  {item.summary}
                                </ThemedText>
                              ) : null}
                            </View>
                          </DragSafeTouchableOpacity>
                        ))}
                      </View>
                    </Card>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
        {!isSidebarLayout && sortedSections.length > 0 && (
          <SectionNavigatorOverlay
            sections={sortedSections}
            selectedId={selectedSectionId}
            onSelect={handleSelectSection}
            accentColor={accentColor}
            tintColor={tintColor}
          />
        )}
      </ThemedView>
    </AnimatedView>
  );
}

type ActionBarProps = {
  onCopy: () => void;
  onShare: () => void;
  onOpenPdf: () => void;
  hasPdf: boolean;
  tintColor: string;
  accentColor: string;
};

function ActionBar({ onCopy, onShare, onOpenPdf, hasPdf, tintColor, accentColor }: ActionBarProps) {
  return (
    <Card elevation="md" style={styles.actionCard}>
      <View style={styles.actionRow}>
        <ActionButton
          label="コピー"
          icon="content-copy"
          onPress={onCopy}
          accentColor={accentColor}
        />
        <ActionButton
          label="共有"
          icon="share-variant"
          onPress={onShare}
          accentColor={accentColor}
        />
        <ActionButton
          label="PDF"
          icon="open-in-new"
          onPress={onOpenPdf}
          accentColor={accentColor}
          disabled={!hasPdf}
          tintColor={tintColor}
        />
      </View>
      {!hasPdf && (
        <ThemedText style={styles.actionHint}>
          この規則には PDF リンクがまだ設定されていません。
        </ThemedText>
      )}
    </Card>
  );
}
type SectionNavigatorProps = {
  sections: SchoolRuleSection[];
  selectedId: string | null;
  onSelect: (sectionId: string) => void;
  accentColor: string;
  containerStyle?: StyleProp<ViewStyle>;
  forceVertical?: boolean;
};

type SectionNavigatorOverlayProps = {
  sections: SchoolRuleSection[];
  selectedId: string | null;
  onSelect: (sectionId: string) => void;
  accentColor: string;
  tintColor: string;
};

function SectionNavigatorOverlay({ sections, selectedId, onSelect, accentColor, tintColor }: SectionNavigatorOverlayProps) {
  const [visible, setVisible] = useState(false);

  if (sections.length === 0) {
    return null;
  }

  React.useEffect(() => {
    setVisible(false);
  }, [sections]);

  const handleSelect = useCallback(
    (sectionId: string) => {
      onSelect(sectionId);
      setVisible(false);
    },
    [onSelect],
  );

  return (
    <>
      <DragSafeTouchableOpacity
        style={[styles.sectionFab, { backgroundColor: accentColor }]}
        onPress={() => setVisible(true)}
        accessibilityLabel="章にジャンプ"
        accessibilityHint="目次を開きます"
        accessibilityRole="button"
        hitSlop={12}
      >
        <Icon name="format-list-text" size={22} color="#fff" />
        <ThemedText style={styles.sectionFabLabel}>目次</ThemedText>
      </DragSafeTouchableOpacity>
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.sectionOverlayBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.sectionOverlaySurface}>
                <SectionNavigator
                  sections={sections}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  accentColor={accentColor}
                  containerStyle={styles.sectionOverlayCard}
                  forceVertical
                />
                <DragSafeTouchableOpacity
                  style={[
                    styles.sectionOverlayClose,
                    {
                      backgroundColor: accentColor + '15',
                      borderColor: accentColor + '30',
                    },
                  ]}
                  onPress={() => setVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="目次を閉じる"
                  hitSlop={12}
                >
                  <Icon name="close" size={20} color={tintColor} />
                </DragSafeTouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

function SectionNavigator({ sections, selectedId, onSelect, accentColor, containerStyle, forceVertical }: SectionNavigatorProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 640;
  const useHorizontal = !forceVertical && isCompact;

  if (sections.length === 0) {
    return null;
  }

  const renderButton = (section: SchoolRuleSection) => {
    const selected = section.id === selectedId;
    return (
      <DragSafeTouchableOpacity
        key={section.id}
        style={[
          styles.sectionNavigatorButton,
          forceVertical && styles.sectionNavigatorButtonFull,
          forceVertical && { marginRight: 0 },
          {
            backgroundColor: selected ? accentColor : accentColor + '15',
            borderColor: selected ? accentColor : accentColor + '35',
          },
        ]}
        onPress={() => onSelect(section.id)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <ThemedText
          style={[
            styles.sectionNavigatorLabel,
            { color: selected ? '#fff' : accentColor },
          ]}
        >
          {section.title}
        </ThemedText>
      </DragSafeTouchableOpacity>
    );
  };

  return (
    <Card elevation="md" style={[styles.sectionNavigatorCard, containerStyle]}>
      <View style={styles.sectionNavigatorHeader}>
        <Icon name="format-list-text" size={20} color={accentColor} />
        <ThemedText type="defaultSemiBold">章にジャンプ</ThemedText>
      </View>
      {useHorizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionNavigatorScrollContent}
        >
          {sections.map(renderButton)}
        </ScrollView>
      ) : forceVertical ? (
        <ScrollView
          style={styles.sectionNavigatorVerticalScroll}
          contentContainerStyle={styles.sectionNavigatorColumn}
          showsVerticalScrollIndicator={false}
        >
          {sections.map(renderButton)}
        </ScrollView>
      ) : (
        <View style={styles.sectionNavigatorWrap}>{sections.map(renderButton)}</View>
      )}
    </Card>
  );
}

type ActionButtonProps = {
  label: string;
  icon: keyof typeof Icon.glyphMap;
  onPress: () => void;
  accentColor: string;
  disabled?: boolean;
  tintColor?: string;
};

function ActionButton({
  label,
  icon,
  onPress,
  accentColor,
  disabled = false,
  tintColor,
}: ActionButtonProps) {
  return (
    <DragSafeTouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: accentColor + '15', borderColor: accentColor + '40' },
        disabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Icon name={icon} size={18} color={disabled ? tintColor ?? '#888' : accentColor} />
      <ThemedText
        style={[
          styles.actionLabel,
          { color: disabled ? tintColor ?? '#888' : accentColor },
        ]}
      >
        {label}
      </ThemedText>
    </DragSafeTouchableOpacity>
  );
}

type RuleBodyProps = {
  rule: SchoolRule;
  formatArticle: (article: SchoolRuleArticle) => string;
  sections: SchoolRuleSection[];
  onSectionsContainerLayout?: (offsetY: number) => void;
  onSectionLayout?: (sectionId: string, layoutY: number) => void;
  onArticleLayout?: (sectionId: string, articleId: string, layoutY: number) => void;
  accentColor: string;
  highlightedArticleId: string | null;
  onShareSection: (section: SchoolRuleSection) => void;
  onShareArticle: (sectionId: string, sectionTitle: string, article: SchoolRuleArticle) => void;
  loading?: boolean;
};

function RuleBody({
  rule,
  formatArticle,
  sections,
  onSectionsContainerLayout,
  onSectionLayout,
  onArticleLayout,
  accentColor,
  highlightedArticleId,
  onShareSection,
  onShareArticle,
  loading = false,
}: RuleBodyProps) {
  const hasSections = sections.length > 0;
  const hasArticles = Boolean(rule.articles && rule.articles.length > 0);

  if (!loading && !hasSections && !hasArticles) {
    return (
      <Card elevation="md" style={styles.feedbackCard}>
        <Icon name="text-box-remove-outline" size={32} color="#999" />
        <ThemedText style={styles.feedbackText}>
          この規則の条文データはまだ整備されていません。
        </ThemedText>
      </Card>
    );
  }

  if (hasSections) {
    return (
      <View
        style={styles.sectionList}
        onLayout={(event) => onSectionsContainerLayout?.(event.nativeEvent.layout.y)}
      >
        {sections.map((section) => (
          <Card
            elevation="sm"
            key={section.id}
            style={styles.sectionCard}
            onLayout={(event) => onSectionLayout?.(section.id, event.nativeEvent.layout.y)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderInfo}>
                <Icon name="folder-text-outline" size={18} color="#888" />
                <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
              </View>
              <DragSafeTouchableOpacity
                style={[
                  styles.sectionShareButton,
                  {
                    borderColor: accentColor + '30',
                    backgroundColor: accentColor + '14',
                  },
                ]}
                onPress={() => onShareSection(section)}
                accessibilityLabel={`${section.title}のリンクを共有`}
              >
                <Icon name="link-variant" size={16} color={accentColor} />
              </DragSafeTouchableOpacity>
            </View>
            {section.summary ? (
              <ThemedText style={styles.sectionSummary}>{section.summary}</ThemedText>
            ) : null}
            <View style={styles.articleList}>
              {section.articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  formatted={formatArticle(article)}
                  onShareLink={() => onShareArticle(section.id, section.title, article)}
                  onMeasure={(layoutY) => onArticleLayout?.(section.id, article.id, layoutY)}
                  isHighlighted={highlightedArticleId === article.id}
                />
              ))}
            </View>
          </Card>
        ))}
      </View>
    );
  }

  const articles = [...(rule.articles ?? [])];
  return (
    <View style={styles.articleList}>
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          formatted={formatArticle(article)}
          isHighlighted={highlightedArticleId === article.id}
        />
      ))}
    </View>
  );
}

type ArticleCardProps = {
  article: SchoolRuleArticle;
  formatted: string;
  onShareLink?: () => void;
  onMeasure?: (layoutY: number) => void;
  isHighlighted: boolean;
};

function ArticleCard({ article, formatted, onShareLink, onMeasure, isHighlighted }: ArticleCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const accentColor = Colors[colorScheme].accent;
  const borderColor = Colors[colorScheme].border;
  const surface = Colors[colorScheme].card;
  const handleCopyArticle = useCallback(async () => {
    await Clipboard.setStringAsync(formatted);
    if (Platform.OS === 'android') {
      ToastAndroid.show('条文をコピーしました', ToastAndroid.SHORT);
    } else {
      Alert.alert('', '条文をコピーしました');
    }
  }, [formatted]);

  const isEmpty = !article.body || article.body.trim().length === 0;

  return (
    <Card
      elevation="sm"
      style={[
        styles.articleCard,
        {
          backgroundColor: surface,
          borderColor: borderColor,
          borderLeftColor: accentColor,
          borderLeftWidth: 3,
        },
        isHighlighted && {
          borderColor: accentColor,
          backgroundColor: accentColor + '18',
        },
      ]}
      noPadding
      onLayout={(event) => onMeasure?.(event.nativeEvent.layout.y)}
    >
      <View style={styles.articleContent}>
        {article.label ? (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: accentColor + '40',
              backgroundColor: accentColor + '15',
              marginBottom: 4,
            }}
          >
            <ThemedText style={[styles.articleLabel, { color: accentColor }]}>
              {article.label}
            </ThemedText>
          </View>
        ) : null}

        {isEmpty ? (
          <ThemedText style={styles.articleEmpty}>本文は準備中です。</ThemedText>
        ) : (
          <Markdown content={article.body} isMarkdown={true} />
        )}

        {article.notes ? (
          <View style={{ gap: 4 }}>
            <ThemedText style={styles.articleNotes}>（備考）</ThemedText>
            <Markdown content={article.notes} isMarkdown={true} />
          </View>
        ) : null}
      </View>
      <View style={styles.articleActionRow}>
        {onShareLink ? (
          <DragSafeTouchableOpacity
            style={[
              styles.articleActionButton,
              {
                borderColor: accentColor + '25',
                backgroundColor: accentColor + '10',
              },
            ]}
            onPress={onShareLink}
          >
            <Icon name="link-variant" size={16} color={accentColor} />
            <ThemedText style={[styles.articleActionText, { color: accentColor }]}>リンク</ThemedText>
          </DragSafeTouchableOpacity>
        ) : null}
        <DragSafeTouchableOpacity
          style={[
            styles.articleActionButton,
            {
              borderColor: accentColor + '30',
              backgroundColor: accentColor + '12',
            },
          ]}
          onPress={handleCopyArticle}
        >
          <Icon name="content-copy" size={16} color={accentColor} />
          <ThemedText style={[styles.articleActionText, { color: accentColor }]}>コピー</ThemedText>
        </DragSafeTouchableOpacity>
      </View>
    </Card>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  feedbackCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  feedbackText: {
    textAlign: 'center',
    fontSize: 15,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  retryButtonText: {
    fontWeight: '600',
  },
  headerCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: Spacing.xs,
  },
  chapterLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  ruleSummary: {
    fontSize: 14,
    opacity: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaText: {
    opacity: 0.7,
  },
  actionCard: {
    gap: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionHint: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  ruleLayout: {
    gap: Spacing.md,
  },
  ruleLayoutSidebar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  ruleMain: {
    flex: 1,
    gap: Spacing.md,
  },
  sectionSidebar: {
    width: 260,
    alignSelf: 'flex-start',
  },
  sectionFab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionFabLabel: {
    marginLeft: Spacing.xs,
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  sectionOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sectionOverlaySurface: {
    position: 'relative',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  sectionOverlayCard: {
    width: '100%',
  },
  sectionOverlayClose: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xs,
  },
  sectionList: {
    gap: Spacing.sm,
  },
  sectionNavigatorCard: {
    gap: Spacing.sm,
  },
  sectionNavigatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionNavigatorScrollContent: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.xs,
    alignItems: 'center',
  },
  sectionNavigatorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sectionNavigatorColumn: {
    flexDirection: 'column',
    gap: Spacing.xs,
    alignItems: 'stretch',
  },
  sectionNavigatorVerticalScroll: {
    maxHeight: 420,
  },
  sectionNavigatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  sectionNavigatorButtonFull: {
    alignSelf: 'stretch',
  },
  sectionNavigatorLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  sectionHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  sectionShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 1.2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSummary: {
    fontSize: 13,
    opacity: 0.75,
    lineHeight: 18,
  },
  articleList: {
    gap: Spacing.sm,
  },
  articleCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  articleContent: {
    gap: Spacing.xs / 2,
  },
  articleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  articleBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  articleEmpty: {
    fontSize: 14,
    opacity: 0.6,
  },
  articleNotes: {
    fontSize: 13,
    opacity: 0.7,
  },
  articleActionRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  articleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.1,
  },
  articleActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  relatedCard: {
    gap: Spacing.sm,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  relatedList: {
    gap: Spacing.xs,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs / 1.2,
  },
  relatedContent: {
    flex: 1,
    gap: Spacing.xs / 2,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  relatedSummary: {
    fontSize: 12,
    opacity: 0.65,
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
});
