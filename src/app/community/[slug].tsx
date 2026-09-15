import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCommunity, joinCommunity } from '@/api/communities';
import { getFeed } from '@/api/posts';
import { CommunityMemberRow } from '@/components/community/CommunityMemberRow';
import { CreatePostForm } from '@/components/feed/CreatePostForm';
import { CommunityDetailSkeleton } from '@/components/skeletons';
import { PostCard } from '@/components/feed/PostCard';
import { ReportPostModal } from '@/components/feed/ReportPostModal';
import { PackTitleWithBadges } from '@/components/packs/PackTitleWithBadges';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { DEFAULT_PACK_RULES, isPackJoined } from '@/lib/communityStatus';
import { usePostVerb } from '@/hooks/usePostVerb';
import { applyFeedCounts, applyPostRowCounts, subscribeYardFeed } from '@/lib/subscribeYardFeed';
import { getSupabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/useAuthStore';
import type { Community, CommunityHub, Post } from '@/types/api';

type HubTab = 'feed' | 'members' | 'about';

function formatMembers(count?: number) {
  const n = count ?? 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export default function CommunityHubScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const activePet = useAuthStore((s) => s.activePet);
  const { verb, verbLower, verbPluralLower } = usePostVerb(activePet);
  const petIdRef = useRef(activePet?.id);
  petIdRef.current = activePet?.id;
  const [hub, setHub] = useState<CommunityHub | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<HubTab>('feed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const community = hub?.community;
  const joined = Boolean(hub?.joined || (community && isPackJoined(community)));

  const load = useCallback(async () => {
    if (!slug) return;
    const detail = await getCommunity(slug, activePet?.id);
    setHub(detail);
    if (detail.posts && detail.posts.length > 0) {
      setPosts(detail.posts);
      return;
    }
    try {
      const feed = await getFeed(activePet?.id, detail.community.id);
      setPosts(feed);
    } catch {
      setPosts([]);
    }
  }, [slug, activePet?.id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load()
      .catch(() => {
        if (alive) setHub(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    return subscribeYardFeed({
      onCounts: (payload) => {
        setPosts((prev) => applyFeedCounts(prev, payload, petIdRef.current));
      },
      onPostRow: (row) => {
        setPosts((prev) => applyPostRowCounts(prev, row));
      },
    });
  }, []);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!community?.id) return;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    const channelName = `community-members-${community.id}-${Math.random().toString(36).slice(2, 9)}`;

    void (async () => {
      const supabase = await getSupabase();
      if (!supabase || cancelled) return;
      const next = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'community_members', filter: `community_id=eq.${community.id}` },
          () => {
            loadRef.current().catch(() => {});
          },
        );
      if (cancelled) {
        supabase.removeChannel(next);
        return;
      }
      channel = next;
      next.subscribe();
    })();

    return () => {
      cancelled = true;
      const active = channel;
      channel = null;
      if (active) {
        void getSupabase().then((supabase) => {
          if (supabase) supabase.removeChannel(active);
        });
      }
    };
  }, [community?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await load().catch(() => {});
    setRefreshing(false);
  }

  async function toggleJoin() {
    if (!community || !activePet?.id || joining) return;
    const prevJoined = joined;
    const prevCount = community.member_count || 0;
    setJoining(true);
    setHub((prev) =>
      prev
        ? {
            ...prev,
            joined: !prevJoined,
            community: {
              ...prev.community,
              joined: !prevJoined,
              is_joined: !prevJoined,
              member_count: Math.max(0, prevCount + (prevJoined ? -1 : 1)),
            },
          }
        : prev,
    );
    try {
      const data = await joinCommunity(community.id, activePet.id);
      setHub((prev) =>
        prev
          ? {
              ...prev,
              joined: data.joined,
              community: {
                ...prev.community,
                joined: data.joined,
                is_joined: data.joined,
                member_count: data.member_count,
              },
            }
          : prev,
      );
    } catch (err) {
      setHub((prev) =>
        prev
          ? {
              ...prev,
              joined: prevJoined,
              community: { ...prev.community, joined: prevJoined, is_joined: prevJoined, member_count: prevCount },
            }
          : prev,
      );
      Alert.alert('Pack', err instanceof Error ? err.message : 'Failed to update pack membership');
    } finally {
      setJoining(false);
    }
  }

  function confirmLeave() {
    Alert.alert('Leave pack', `Leave ${community?.name}?`, [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => toggleJoin() },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.skeletonWrap}>
          <CommunityDetailSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.backPlain}>
          <Ionicons name="arrow-back" size={22} color={palette.evergreen} />
          <Text style={styles.backPlainText}>Back</Text>
        </Pressable>
        <Text style={styles.missing}>This pack could not be found.</Text>
      </SafeAreaView>
    );
  }

  const cover = community.cover_image_url || community.logo_image_url;
  const logo = community.logo_image_url || community.cover_image_url;
  const previewMembers = (hub.members || []).slice(0, 4);
  const extraMembers = Math.max(0, (community.member_count || hub.members.length) - previewMembers.length);

  return (
    <View style={styles.safe}>
      <ScrollView
        stickyHeaderIndices={[]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.amber} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback]} />
          )}
          <Pressable onPress={() => router.back()} style={styles.backFab}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.logoRow}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Ionicons name="paw" size={28} color={palette.amber} />
              </View>
            )}
            <View style={styles.actions}>
              {joined ? (
                <Pressable onPress={() => setComposerOpen(true)} style={[styles.barkBtn, { minHeight: TapTarget }]}>
                  <Text style={styles.barkBtnText}>+ New {verb} 🐾</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={joined ? confirmLeave : toggleJoin}
                disabled={joining}
                style={[styles.joinBtn, joined && styles.joinedBtn, { minHeight: TapTarget }]}>
                <Text style={[styles.joinText, joined && styles.joinedText]}>
                  {joined ? 'Joined ✓' : 'Join Pack 🐾'}
                </Text>
              </Pressable>
            </View>
          </View>

          <PackTitleWithBadges
            pack={community}
            title={community.name}
            titleStyle={styles.name}
            iconSize={22}
            pendingLabel="⏳ Pending Super Admin Approval"
          />
          <Text style={styles.handle}>
            @{community.slug} • {formatMembers(community.member_count)} Members
          </Text>
          {community.description ? <Text style={styles.bio}>{community.description}</Text> : null}

          <View style={styles.avatars}>
            {previewMembers.map((member) =>
              member.profile_image_url ? (
                <Image key={member.id} source={{ uri: member.profile_image_url }} style={styles.stack} />
              ) : (
                <View key={member.id} style={[styles.stack, styles.stackEmpty]}>
                  <Ionicons name="paw" size={12} color={palette.amber} />
                </View>
              ),
            )}
            <Text style={styles.stackLabel}>
              {formatMembers(community.member_count)} members
              {extraMembers > 0 ? ` · +${formatMembers(extraMembers)} others` : ''}
            </Text>
          </View>

          {hub.announcement ? (
            <View style={styles.pin}>
              <Ionicons name="pin" size={16} color={palette.amber} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pinKicker}>Pinned Announcement</Text>
                <Text style={styles.pinTitle}>{hub.announcement.title}</Text>
                {hub.announcement.content ? <Text style={styles.pinText}>{hub.announcement.content}</Text> : null}
              </View>
            </View>
          ) : null}

          <View style={styles.tabs}>
            {(['feed', 'members', 'about'] as HubTab[]).map((id) => (
              <Pressable key={id} onPress={() => setTab(id)} style={styles.tab}>
                <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>
                  {id === 'feed'
                    ? `Feed (${posts.length})`
                    : id === 'members'
                      ? `Pack Members (${hub.members?.length || 0})`
                      : 'About & Rules'}
                </Text>
                {tab === id ? <View style={styles.tabLine} /> : null}
              </Pressable>
            ))}
          </View>

          {tab === 'feed' ? (
            <View>
              {joined ? (
                <Pressable onPress={() => setComposerOpen(true)} style={styles.inlineComposer}>
                  <Text style={styles.composerText} numberOfLines={1}>
                    {verb} in {community.name}...
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.lockCard}>
                  <Text style={styles.lockTitle}>Only pack members can post {verbPluralLower} here</Text>
                  <Text style={styles.lockBody}>
                    Join {community.name} to share your photo moments, questions & tips with the pack! 🐾
                  </Text>
                  <Pressable onPress={toggleJoin} style={[styles.joinBtn, { alignSelf: 'flex-start', minHeight: 40 }]}>
                    <Text style={styles.joinText}>Join Pack 🐾</Text>
                  </Pressable>
                </View>
              )}
              {posts.length === 0 ? (
                <Text style={styles.empty}>No {verbPluralLower} in this pack yet. Be the first pet to publish a {verbLower} in {community.name}!</Text>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReport={setReportPostId}
                    onPatch={(id, patch) =>
                      setPosts((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
                    }
                  />
                ))
              )}
            </View>
          ) : null}

          {tab === 'members' ? (
            <View style={{ gap: 10 }}>
              {(hub.members || []).length === 0 ? (
                <Text style={styles.empty}>No members listed yet. Join the pack to become the first member! 🐾</Text>
              ) : (
                (hub.members || []).map((member) => (
                  <CommunityMemberRow key={member.id} member={member} />
                ))
              )}
            </View>
          ) : null}

          {tab === 'about' ? (
            <View style={{ gap: 16 }}>
              <View style={styles.aboutCard}>
                <Text style={styles.aboutTitle}>About {community.name}</Text>
                <Text style={styles.rule}>{community.description || 'A Furlo pack for companions and their people.'}</Text>
              </View>
              <View style={styles.aboutCard}>
                <Text style={styles.aboutTitle}>Pack Rules & Guidelines</Text>
                {(hub.rules?.length ? hub.rules : DEFAULT_PACK_RULES).map((rule, index) => (
                  <Text key={`${rule}-${index}`} style={styles.rule}>
                    {index + 1}. {rule}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {tab === 'feed' && joined ? (
        <Pressable onPress={() => setComposerOpen(true)} style={styles.composer}>
          <Text style={styles.composerText} numberOfLines={1}>
            {verb} in {community.name}...
          </Text>
        </Pressable>
      ) : null}

      <Modal visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.cream }}>
          <CreatePostForm
            communities={[community as Community]}
            lockedCommunityId={community.id}
            onCancel={() => setComposerOpen(false)}
            onSuccess={(post) => {
              setPosts((prev) => [post, ...prev]);
              setComposerOpen(false);
            }}
          />
        </SafeAreaView>
      </Modal>

      <ReportPostModal
        postId={reportPostId}
        visible={!!reportPostId}
        onClose={() => setReportPostId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.cream },
  skeletonWrap: { flex: 1, padding: 16 },
  backPlain: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16 },
  backPlainText: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: palette.evergreen },
  missing: { fontFamily: AppFonts.heading, fontSize: 20, color: palette.evergreen, paddingHorizontal: 20 },
  hero: { width: '100%', height: 200, backgroundColor: palette.evergreen },
  heroFallback: { backgroundColor: palette.evergreenSoft },
  backFab: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(1,30,20,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 16, marginTop: -40 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: palette.cream,
    backgroundColor: '#fff',
  },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  joinBtn: {
    backgroundColor: palette.evergreenSoft,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  joinedBtn: { backgroundColor: palette.sage },
  joinText: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#fff' },
  joinedText: { color: palette.evergreenSoft },
  barkBtn: {
    backgroundColor: palette.amber,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  barkBtnText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  moreBtn: {
    width: TapTarget,
    height: TapTarget,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: AppFonts.heading, fontSize: 26, color: palette.evergreen, marginTop: 10 },
  handle: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: palette.evergreenSoft, marginTop: 2 },
  bio: { fontFamily: AppFonts.body, fontSize: 15, color: palette.evergreen, lineHeight: 22, marginTop: 8 },
  avatars: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 0 },
  stack: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.cream,
    marginRight: -8,
    backgroundColor: palette.tabTrack,
  },
  stackEmpty: { alignItems: 'center', justifyContent: 'center' },
  stackLabel: { marginLeft: 14, fontFamily: AppFonts.bodyMedium, fontSize: 13, color: palette.evergreenSoft },
  pin: {
    marginTop: 14,
    backgroundColor: palette.apricot,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  pinText: { fontFamily: AppFonts.body, fontSize: 13, color: '#424844', lineHeight: 18, marginTop: 2 },
  pinKicker: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.brown, textTransform: 'uppercase' },
  pinTitle: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: palette.evergreen, marginTop: 2 },
  inlineComposer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardLine,
    minHeight: TapTarget,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  lockCard: {
    marginTop: 12,
    backgroundColor: 'rgba(255,219,199,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(232,132,58,0.3)',
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  lockTitle: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.evergreen },
  lockBody: { fontFamily: AppFonts.body, fontSize: 12, color: '#424844', lineHeight: 18 },
  memberHandle: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 18, marginTop: 18, borderBottomWidth: 1, borderBottomColor: palette.cardLine },
  tab: { paddingBottom: 10 },
  tabText: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.faded },
  tabTextOn: { color: palette.evergreen },
  tabLine: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: palette.amber, borderTopLeftRadius: 99, borderTopRightRadius: 99 },
  empty: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded, marginTop: 16 },
  memberRow: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 10,
  },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.tabTrack },
  memberName: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: palette.evergreen },
  breedChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: palette.sage,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  breedText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.evergreenSoft },
  memberActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  followChip: {
    backgroundColor: palette.evergreen,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  followChipText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
  wagChip: {
    borderWidth: 1,
    borderColor: palette.cardLine,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wagChipText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.evergreen },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 14,
  },
  aboutLabel: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded },
  aboutValue: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: palette.evergreen, textTransform: 'capitalize' },
  aboutTitle: { fontFamily: AppFonts.headingSemi, fontSize: 16, color: palette.evergreen, marginBottom: 8 },
  adminRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  rule: { fontFamily: AppFonts.body, fontSize: 14, color: palette.evergreen, lineHeight: 20, marginTop: 4 },
  composer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.cardLine,
    minHeight: TapTarget,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  composerText: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded },
});
