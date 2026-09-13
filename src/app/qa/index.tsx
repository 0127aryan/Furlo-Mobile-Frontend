import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getQAQuestions, getQATopHelpers, getQATrending } from '@/api/posts';
import { PostCard } from '@/components/feed/PostCard';
import { ReportPostModal } from '@/components/feed/ReportPostModal';
import { AskQuestionBottomSheet } from '@/components/qa/AskQuestionBottomSheet';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { applyFeedCounts, applyPostRowCounts, subscribeYardFeed } from '@/lib/subscribeYardFeed';
import { useAuthStore } from '@/store/useAuthStore';
import type { HelperPet, Post, QAFilterTab, QuestionPost, TrendingQuestion } from '@/types/api';

const CATEGORY_CHIPS = [
  { id: 'All', label: 'All', icon: '' },
  { id: 'Health', label: 'Health', icon: '🏥' },
  { id: 'Diet', label: 'Diet', icon: '🥗' },
  { id: 'Training', label: 'Training', icon: '🎾' },
  { id: 'Behavior', label: 'Behavior', icon: '🐾' },
];

const FILTER_TABS: { id: QAFilterTab; label: string }[] = [
  { id: 'all', label: 'All Questions' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'solved', label: 'Solved' },
];

export default function QAHubScreen() {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);

  const [questions, setQuestions] = useState<QuestionPost[]>([]);
  const [trending, setTrending] = useState<TrendingQuestion[]>([]);
  const [helpers, setHelpers] = useState<HelperPet[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState<QAFilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  const petIdRef = useRef(activePet?.id);
  petIdRef.current = activePet?.id;

  const loadQuestions = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const data = await getQAQuestions({
          category: activeCategory,
          filter: activeFilter,
          petId: activePet?.id,
        });
        setQuestions(data);
      } catch {
        if (showSpinner) setQuestions([]);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [activeCategory, activeFilter, activePet?.id]
  );

  const loadSidebars = useCallback(async () => {
    try {
      const [trendData, helperData] = await Promise.all([getQATrending(5), getQATopHelpers(5)]);
      setTrending(trendData);
      setHelpers(helperData);
    } catch {
      setTrending([]);
      setHelpers([]);
    }
  }, []);

  useEffect(() => {
    loadQuestions(true);
  }, [loadQuestions]);

  useEffect(() => {
    loadSidebars();
  }, [loadSidebars]);

  useEffect(() => {
    return subscribeYardFeed({
      onCounts: (payload) => {
        setQuestions((prev) => applyFeedCounts(prev, payload, petIdRef.current));
        if (payload.postId) {
          setTrending((prev) =>
            prev.map((item) =>
              item.id === payload.postId
                ? {
                    ...item,
                    like_count:
                      payload.likeCount !== undefined ? payload.likeCount : item.like_count,
                    comment_count:
                      payload.commentCount !== undefined
                        ? payload.commentCount
                        : item.comment_count,
                  }
                : item
            )
          );
        }
      },
      onPostRow: (row) => {
        setQuestions((prev) => applyPostRowCounts(prev, row));
        if (row.id) {
          setTrending((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    like_count:
                      typeof row.like_count === 'number' ? row.like_count : item.like_count,
                    comment_count:
                      typeof row.comment_count === 'number'
                        ? row.comment_count
                        : item.comment_count,
                  }
                : item
            )
          );
        }
      },
    });
  }, []);

  const patchQuestion = useCallback(
    (postId: string, patch: Partial<Pick<Post, 'like_count' | 'comment_count' | 'hasLiked'>>) => {
      setQuestions((prev) => prev.map((q) => (q.id === postId ? { ...q, ...patch } : q)));
      setTrending((prev) =>
        prev.map((item) =>
          item.id === postId
            ? {
                ...item,
                like_count: patch.like_count !== undefined ? patch.like_count : item.like_count,
                comment_count:
                  patch.comment_count !== undefined ? patch.comment_count : item.comment_count,
              }
            : item
        )
      );
    },
    []
  );

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadQuestions(false), loadSidebars()]);
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.amber} />}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={palette.evergreen} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Pet Q&A Hub 🐾</Text>
            <Text style={styles.subtitle}>Ask questions, get advice from pet parents</Text>
          </View>
        </View>

        {helpers.length > 0 ? (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Top Helpful Pets 🏆</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.helpersRow}>
              {helpers.map((helper) => (
                <Pressable
                  key={helper.id}
                  onPress={() => router.push(`/pet/${helper.id}`)}
                  style={styles.helperCard}>
                  <View style={styles.helperAvatarWrap}>
                    {helper.profile_image_url ? (
                      <Image source={{ uri: helper.profile_image_url }} style={styles.helperAvatar} />
                    ) : (
                      <View style={styles.helperAvatarEmpty}>
                        <Ionicons name="paw" size={18} color={palette.amber} />
                      </View>
                    )}
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{helper.rank}</Text>
                    </View>
                  </View>
                  <Text style={styles.helperName} numberOfLines={1}>
                    {helper.name}
                  </Text>
                  <Text style={styles.helperScore}>🐾 {helper.helpful_count}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {trending.length > 0 ? (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Trending Questions</Text>
              <View style={styles.trendingBadge}>
                <Text style={styles.trendingBadgeText}>This Week</Text>
              </View>
            </View>
            {trending.map((item, idx) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/qa/${item.id}`)}
                style={styles.trendingRow}>
                <Text style={styles.trendingNum}>0{idx + 1}</Text>
                <View style={styles.trendingBody}>
                  <Text style={styles.trendingCaption} numberOfLines={2}>
                    {item.caption || 'Pet advice question'}
                  </Text>
                  <Text style={styles.trendingMeta}>
                    {item.comment_count || 0} answers · {item.like_count || 0} treats
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORY_CHIPS.map((chip) => {
            const active = activeCategory === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setActiveCategory(chip.id)}
                style={[styles.categoryChip, active && styles.categoryChipOn]}>
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextOn]}>
                  {chip.icon ? `${chip.icon} ` : ''}
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.filterTabs}>
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                style={[styles.filterTab, active && styles.filterTabOn]}>
                <Text style={[styles.filterTabText, active && styles.filterTabTextOn]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.amber} />
            <Text style={styles.loadingText}>Fetching pet questions...</Text>
          </View>
        ) : questions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="help-circle-outline" size={48} color={palette.amber} />
            <Text style={styles.emptyTitle}>No questions found</Text>
            <Text style={styles.emptyBody}>Be the first pet parent to ask a question!</Text>
            <Pressable onPress={() => setAskOpen(true)} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>Ask a Question 🐾</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {questions.map((q) => (
              <PostCard
                key={q.id}
                post={q}
                onReport={setReportingPostId}
                onPatch={patchQuestion}
                onPress={() => router.push(`/qa/${q.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable onPress={() => setAskOpen(true)} style={styles.fab}>
        <Ionicons name="help-circle" size={22} color="#fff" />
        <Text style={styles.fabText}>Ask Question</Text>
      </Pressable>

      <AskQuestionBottomSheet
        visible={askOpen}
        onClose={() => setAskOpen(false)}
        onSuccess={(_post) => {
          loadQuestions(false);
          loadSidebars();
        }}
      />

      <ReportPostModal
        postId={reportingPostId}
        visible={!!reportingPostId}
        onClose={() => setReportingPostId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDF8F2' },
  scroll: { padding: 16, paddingBottom: 100, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  backBtn: { paddingTop: 4 },
  headerText: { flex: 1 },
  title: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.evergreen },
  subtitle: { fontFamily: AppFonts.body, fontSize: 13, color: palette.faded, marginTop: 4 },
  widget: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 16,
    gap: 12,
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  widgetTitle: { fontFamily: AppFonts.headingSemi, fontSize: 15, color: palette.evergreen },
  trendingBadge: {
    backgroundColor: palette.apricot,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  trendingBadgeText: { fontFamily: AppFonts.bodySemi, fontSize: 10, color: palette.brown },
  helpersRow: { gap: 12, paddingTop: 5 },
  helperCard: { alignItems: 'center', width: 80, gap: 4 },
  helperAvatarWrap: { position: 'relative' },
  helperAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: palette.cardLine },
  helperAvatarEmpty: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.evergreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontFamily: AppFonts.bodySemi, fontSize: 10, color: '#fff' },
  helperName: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.evergreen, textAlign: 'center' },
  helperScore: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.amber },
  trendingRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${palette.cardLine}80`,
  },
  trendingNum: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.faded, marginTop: 2 },
  trendingBody: { flex: 1, gap: 2 },
  trendingCaption: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.evergreen, lineHeight: 18 },
  trendingMeta: { fontFamily: AppFonts.body, fontSize: 11, color: palette.faded },
  categoryRow: { gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  categoryChipOn: { backgroundColor: palette.evergreenSoft, borderColor: palette.evergreenSoft },
  categoryChipText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.evergreenSoft },
  categoryChipTextOn: { color: '#fff' },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: palette.tabTrack,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  filterTabOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  filterTabText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.faded },
  filterTabTextOn: { color: palette.evergreen },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontFamily: AppFonts.heading, fontSize: 18, color: palette.evergreen },
  emptyBody: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded, textAlign: 'center' },
  emptyCta: {
    marginTop: 8,
    backgroundColor: palette.evergreenSoft,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    minHeight: TapTarget,
    justifyContent: 'center',
  },
  emptyCtaText: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#fff' },
  list: { gap: 12 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.amber,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minHeight: TapTarget,
  },
  fabText: { fontFamily: AppFonts.headingSemi, fontSize: 14, color: '#fff' },
});
