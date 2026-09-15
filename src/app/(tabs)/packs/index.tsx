import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCommunityCategories, getCommunities, getMyCommunities, joinCommunity } from '@/api/communities';
import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { PackListSkeleton } from '@/components/skeletons';
import { CreatePackBottomSheet } from '@/components/packs/CreatePackBottomSheet';
import { PackTitleWithBadges } from '@/components/packs/PackTitleWithBadges';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { isPackJoined } from '@/lib/communityStatus';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Community } from '@/types/api';

const ALL_PACKS = 'All Packs';

function formatMembers(count?: number) {
  const n = count ?? 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function patchPack(list: Community[], id: string, patch: Partial<Community>) {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export default function PacksScreen() {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([ALL_PACKS]);
  const [category, setCategory] = useState(ALL_PACKS);
  const [packs, setPacks] = useState<Community[]>([]);
  const [mine, setMine] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [list, nextCategories, myPacks] = await Promise.all([
          getCommunities({
            q: query.trim() || undefined,
            category,
            petId: activePet?.id,
          }),
          getCommunityCategories().catch(() => [ALL_PACKS]),
          activePet?.id ? getMyCommunities(activePet.id).catch(() => []) : Promise.resolve([]),
        ]);
        setPacks(Array.isArray(list) ? list : []);
        setMine(Array.isArray(myPacks) ? myPacks : []);
        setCategories(nextCategories.length > 0 ? nextCategories : [ALL_PACKS]);
        setCategory((current) => (nextCategories.includes(current) ? current : ALL_PACKS));
      } catch {
        if (!silent) setPacks([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [query, category, activePet?.id],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    void (async () => {
      const supabase = await getSupabase();
      if (!supabase || cancelled) return;
      channel = supabase
        .channel(`community-members-mobile-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members' }, () => {
          load(true);
        });
      void channel.subscribe();
    })();
    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, [load]);

  const featuredPack = packs.find((pack) => pack.slug === 'golden-retriever-club') || packs[0];
  const remainingPacks = packs.filter((pack) => pack.id !== featuredPack?.id);

  async function onRefresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  async function toggleJoin(pack: Community) {
    if (!activePet?.id) {
      Alert.alert('Pack', 'Please log in with a pet profile to join a pack 🐾');
      return;
    }
    if (joiningId) return;
    setJoiningId(pack.id);
    const prev = isPackJoined(pack);
    const prevCount = pack.member_count || 0;
    const next = {
      joined: !prev,
      is_joined: !prev,
      member_count: Math.max(0, prevCount + (prev ? -1 : 1)),
    };
    setPacks((list) => patchPack(list, pack.id, next));
    try {
      const data = await joinCommunity(pack.id, activePet.id);
      setPacks((list) =>
        patchPack(list, pack.id, {
          joined: data.joined,
          is_joined: data.joined,
          member_count: data.member_count,
        }),
      );
      if (activePet.id) {
        const myPacks = await getMyCommunities(activePet.id).catch(() => mine);
        setMine(myPacks);
      }
    } catch (err) {
      setPacks((list) =>
        patchPack(list, pack.id, { joined: prev, is_joined: prev, member_count: prevCount }),
      );
      Alert.alert('Pack', err instanceof Error ? err.message : 'Failed to update membership');
    } finally {
      setJoiningId(null);
    }
  }

  function renderJoin(pack: Community, featured = false) {
    const joined = isPackJoined(pack);
    return (
      <Pressable
        onPress={() => toggleJoin(pack)}
        disabled={joiningId === pack.id}
        style={[
          styles.joinBtn,
          { minHeight: featured ? TapTarget : 36 },
          joined && styles.joinedBtn,
        ]}>
        <Text style={[styles.joinText, joined && styles.joinedText]}>
          {joined ? 'Joined ✓' : featured ? 'Join Pack 🐾' : 'Join'}
        </Text>
      </Pressable>
    );
  }

  function renderCard(pack: Community, featured = false) {
    return (
      <Pressable
        key={pack.id}
        onPress={() => router.push(`/community/${pack.slug}`)}
        style={[styles.card, featured && styles.featuredCard]}>
        <View style={styles.coverWrap}>
          {pack.cover_image_url ? (
            <Image source={{ uri: pack.cover_image_url }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Ionicons name="leaf-outline" size={32} color={palette.amber} />
            </View>
          )}
          {featured ? (
            <View style={styles.trendPill}>
              <Ionicons name="flame" size={12} color={palette.evergreenSoft} />
              <Text style={styles.trendText}>Featured Pack</Text>
            </View>
          ) : null}
        </View>
        <PackTitleWithBadges
          pack={pack}
          title={pack.name}
          titleStyle={featured ? styles.featuredTitle : styles.cardTitle}
        />
        {pack.description ? (
          <Text style={styles.cardBody} numberOfLines={2}>
            {pack.description}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            {formatMembers(pack.member_count)} {featured ? 'Pack Members' : 'Members'}
          </Text>
          {renderJoin(pack, featured)}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.backRow}>
        <ScreenBackButton />
      </View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Find Your Pack 🐾</Text>
          <Text style={styles.subtitle}>Connect with pet parents who share your breed, city, and pet passions.</Text>
        </View>
        <Pressable onPress={() => setCreateOpen(true)} style={styles.createBtn} hitSlop={8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Create</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={palette.faded} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load()}
          placeholder="Sniff around for a pack..."
          placeholderTextColor={palette.faded}
          style={styles.search}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}>
        {categories.map((filter) => {
          const on = category === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setCategory(filter)}
              style={[styles.filter, on && styles.filterOn]}>
              <Text style={[styles.filterText, on && styles.filterTextOn]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <PackListSkeleton />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.amber} />}>
          {mine.length > 0 ? (
            <View style={styles.mineCard}>
              <Text style={styles.section}>My Joined Packs</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mineRow}>
                <Pressable onPress={() => setCreateOpen(true)} style={styles.mineAdd}>
                  <Ionicons name="add" size={22} color={palette.amber} />
                </Pressable>
                {mine.map((pack) => (
                  <Pressable
                    key={pack.id}
                    onPress={() => router.push(`/community/${pack.slug}`)}
                    style={styles.mineItem}>
                    {pack.logo_image_url || pack.cover_image_url ? (
                      <Image
                        source={{ uri: pack.logo_image_url || pack.cover_image_url || '' }}
                        style={styles.mineAvatar}
                      />
                    ) : (
                      <View style={[styles.mineAvatar, styles.minePlaceholder]}>
                        <Ionicons name="paw" size={22} color={palette.amber} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.section}>Trending & Popular Packs</Text>
          {packs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={palette.brown} />
              <Text style={styles.emptyTitle}>No packs found</Text>
              <Text style={styles.empty}>Try searching for another keyword or category.</Text>
            </View>
          ) : (
            <>
              {featuredPack ? renderCard(featuredPack, true) : null}
              {remainingPacks.map((pack) => renderCard(pack))}
            </>
          )}
        </ScrollView>
      )}

      <CreatePackBottomSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          load(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  backRow: { paddingHorizontal: 12, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  title: { fontFamily: AppFonts.heading, fontSize: 28, color: palette.evergreen },
  subtitle: { fontFamily: AppFonts.body, fontSize: 13, color: '#424844', marginTop: 4, paddingRight: 8 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.amber,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 36,
  },
  createBtnText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  searchWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.cardLine,
    paddingHorizontal: 14,
    minHeight: TapTarget,
  },
  search: { flex: 1, fontFamily: AppFonts.body, fontSize: 15, color: palette.evergreen, paddingVertical: 10 },
  filtersScroll: { flexGrow: 0 },
  filters: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filter: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
    height: 36,
    justifyContent: 'center',
  },
  filterOn: { backgroundColor: palette.apricot, borderColor: 'rgba(232,132,58,0.3)' },
  filterText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#424844' },
  filterTextOn: { color: palette.brown },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  skeletonWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { fontFamily: AppFonts.headingSemi, fontSize: 18, color: palette.evergreen, marginBottom: 10 },
  empty: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded, marginBottom: 8, textAlign: 'center' },
  emptyTitle: { fontFamily: AppFonts.headingSemi, fontSize: 18, color: palette.evergreen, marginTop: 8 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 28,
    alignItems: 'center',
  },
  mineCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 14,
    marginBottom: 20,
  },
  mineRow: { gap: 12, paddingBottom: 4, alignItems: 'center' },
  mineAdd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.cardLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mineItem: { width: 56, alignItems: 'center' },
  mineAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: palette.tabTrack, borderWidth: 2, borderColor: palette.sage },
  minePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  featuredCard: { paddingBottom: 14 },
  coverWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 10 },
  cover: { width: '100%', aspectRatio: 16 / 9, backgroundColor: palette.tabTrack },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  trendPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: palette.sage,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.evergreenSoft },
  featuredTitle: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.evergreen },
  cardTitle: { fontFamily: AppFonts.heading, fontSize: 18, color: palette.evergreen },
  cardMeta: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.faded },
  cardBody: { fontFamily: AppFonts.body, fontSize: 14, color: '#424844', marginTop: 6, lineHeight: 20 },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.cardLine,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joinBtn: {
    backgroundColor: palette.evergreenSoft,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  joinedBtn: { backgroundColor: palette.sage },
  joinText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  joinedText: { color: palette.evergreenSoft },
});
