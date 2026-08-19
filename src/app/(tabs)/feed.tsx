import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { getCommunities } from '@/api/auth';
import { getFeed } from '@/api/posts';
import { CreatePostForm } from '@/components/feed/CreatePostForm';
import { PostCard } from '@/components/feed/PostCard';
import { ReportPostModal } from '@/components/feed/ReportPostModal';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { loadSpeciesVerbsFromDB } from '@/lib/petVerbMap';
import { getAccessToken, getRefreshToken } from '@/lib/secureStore';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Community, Post } from '@/types/api';

export default function FeedScreen() {
  const activePet = useAuthStore((s) => s.activePet);
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  const petName = activePet?.name || user?.name || 'companion';

  const loadFeed = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const nextPosts = await getFeed(activePet?.id);
      setPosts(nextPosts);
    } catch {
      if (showSpinner) setPosts([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [activePet?.id]);

  useEffect(() => {
    loadSpeciesVerbsFromDB();
    getCommunities()
      .then(setCommunities)
      .catch(() => setCommunities([]));
  }, []);

  useEffect(() => {
    loadFeed(true);

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let client: Awaited<ReturnType<typeof getSupabase>> = null;

    (async () => {
      const supabase = await getSupabase();
      client = supabase;
      if (!supabase || cancelled) return;

      const access_token = await getAccessToken();
      const refresh_token = await getRefreshToken();
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
      if (cancelled) return;

      channel = supabase
        .channel('yard-feed', { config: { broadcast: { ack: false, self: true } } })
        .on('broadcast', { event: 'post' }, ({ payload }) => {
          const incoming = payload as Post | { post?: Post };
          const post = 'id' in (incoming || {}) && (incoming as Post).id
            ? (incoming as Post)
            : (incoming as { post?: Post }).post;
          if (!post?.id) return;
          setPosts((prev) => (prev.some((item) => item.id === post.id) ? prev : [post, ...prev]));
        })
        .on('broadcast', { event: 'counts' }, ({ payload }) => {
          const row = payload as {
            postId?: string;
            likeCount?: number;
            commentCount?: number;
            likedByPetId?: string | null;
            unlikedByPetId?: string | null;
          };
          if (!row?.postId) return;
          setPosts((prev) =>
            prev.map((post) => {
              if (post.id !== row.postId) return post;
              return {
                ...post,
                like_count: row.likeCount !== undefined ? row.likeCount : post.like_count,
                comment_count: row.commentCount !== undefined ? row.commentCount : post.comment_count,
                hasLiked:
                  row.likedByPetId === activePet?.id
                    ? true
                    : row.unlikedByPetId === activePet?.id
                      ? false
                      : post.hasLiked,
              };
            })
          );
        })
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'posts' },
          (payload) => {
            const row = payload.new as { id: string; like_count?: number; comment_count?: number };
            if (row?.id) {
              setPosts((prev) =>
                prev.map((post) =>
                  post.id === row.id
                    ? {
                        ...post,
                        like_count: row.like_count !== undefined ? row.like_count : post.like_count,
                        comment_count:
                          row.comment_count !== undefined
                            ? Math.max(post.comment_count || 0, row.comment_count)
                            : post.comment_count,
                      }
                    : post
                )
              );
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'likes' },
          (payload) => {
            const row = (payload.new || payload.old) as { post_id?: string; pet_id?: string };
            if (row?.pet_id === activePet?.id && row.post_id) {
              setPosts((prev) =>
                prev.map((post) =>
                  post.id === row.post_id
                    ? { ...post, hasLiked: payload.eventType === 'INSERT' }
                    : post
                )
              );
            }
          }
        )
        .subscribe();

      if (cancelled) {
        supabase.removeChannel(channel);
        channel = null;
      }
    })();

    return () => {
      cancelled = true;
      if (channel && client) client.removeChannel(channel);
    };
  }, [activePet?.id]);

  const patchPost = useCallback(
    (postId: string, patch: Partial<Pick<Post, 'like_count' | 'comment_count' | 'hasLiked'>>) => {
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...patch } : post)));
    },
    []
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadFeed(false);
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.amber} />}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Ionicons name="paw" size={22} color={palette.amber} />
            <Text style={styles.brand}>furlo</Text>
          </View>
          <Pressable onPress={() => setCreateOpen(true)} style={styles.headerCta}>
            <Text style={styles.headerCtaLabel}>+ Post Bark</Text>
          </Pressable>
        </View>

        <Pressable style={styles.composer} onPress={() => setCreateOpen(true)}>
          <View style={styles.composerRow}>
            {activePet?.profile_image_url ? (
              <Image source={{ uri: activePet.profile_image_url }} style={styles.composerAvatar} />
            ) : (
              <View style={styles.composerAvatarEmpty}>
                <Ionicons name="paw" size={16} color={palette.amber} />
              </View>
            )}
            <View style={styles.fakeInput}>
              <Text style={styles.placeholder}>What's {petName} up to today?</Text>
            </View>
          </View>
          <View style={styles.composerActions}>
            <View style={styles.quick}>
              <Ionicons name="image-outline" size={18} color={palette.amber} />
              <Text style={styles.quickLabel}>Photo</Text>
            </View>
            <View style={styles.quick}>
              <Ionicons name="help-circle-outline" size={18} color={palette.forest} />
              <Text style={styles.quickLabel}>Question</Text>
            </View>
            <View style={styles.quick}>
              <Ionicons name="bulb-outline" size={18} color={palette.brown} />
              <Text style={styles.quickLabel}>Tip</Text>
            </View>
            <View style={styles.postBark}>
              <Text style={styles.postBarkLabel}>Post Bark</Text>
            </View>
          </View>
        </Pressable>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.amber} />
            <Text style={styles.loadingText}>Fetching barks in The Yard...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="paw" size={32} color={palette.amber} />
            </View>
            <Text style={styles.emptyTitle}>The Yard is quiet right now 🐾</Text>
            <Text style={styles.emptyBody}>
              Be the first pet in your pack to post a bark, ask a question, or share a photo!
            </Text>
            <Pressable
              onPress={() => setCreateOpen(true)}
              style={StyleSheet.flatten([styles.emptyCta, { minHeight: TapTarget }])}>
              <Text style={styles.emptyCtaLabel}>+ Post First Bark</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {posts.filter((post) => post?.id).map((post) => (
              <PostCard key={post.id} post={post} onReport={setReportingPostId} onPatch={patchPost} />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <SafeAreaView style={styles.safe}>
          <CreatePostForm
            communities={communities}
            onCancel={() => setCreateOpen(false)}
            onSuccess={(post) => {
              setPosts((prev) => [post, ...prev]);
              setCreateOpen(false);
            }}
          />
        </SafeAreaView>
      </Modal>

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
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontFamily: AppFonts.heading, fontSize: 20, color: '#163328' },
  headerCta: {
    backgroundColor: palette.amber,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerCtaLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
  composer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    gap: 12,
  },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  composerAvatar: { width: 40, height: 40, borderRadius: 20 },
  composerAvatarEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ede8e1',
  },
  fakeInput: {
    flex: 1,
    backgroundColor: '#FDF8F2',
    borderWidth: 1,
    borderColor: '#ede8e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  placeholder: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  quick: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 13, color: palette.muted },
  postBark: {
    marginLeft: 'auto',
    backgroundColor: palette.amber,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  postBarkLabel: { fontFamily: AppFonts.headingSemi, fontSize: 13, color: '#fff' },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontFamily: AppFonts.heading, fontSize: 18, color: '#163328', textAlign: 'center' },
  emptyBody: {
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCta: {
    marginTop: 8,
    backgroundColor: palette.amber,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaLabel: { fontFamily: AppFonts.headingSemi, fontSize: 14, color: '#fff' },
  list: { gap: 16 },
});
