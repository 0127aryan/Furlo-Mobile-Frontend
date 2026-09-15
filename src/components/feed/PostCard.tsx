import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { createComment, getComments, likePost } from '@/api/posts';
import { ListRowsSkeleton } from '@/components/skeletons';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/formatTime';
import { getCommentVerb, getCommentVerbPlural } from '@/lib/petVerbMap';
import { useAuthStore } from '@/store/useAuthStore';
import type { CommentItem, Post } from '@/types/api';

type Props = {
  post: Post;
  onReport: (postId: string) => void;
  onPatch?: (postId: string, patch: Partial<Pick<Post, 'like_count' | 'comment_count' | 'hasLiked'>>) => void;
  onPress?: () => void;
};

const CARD_GUTTER = 32;

function firstRecord<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function PostCard({ post, onReport, onPatch, onPress }: Props) {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);
  const pet = firstRecord(post.pets);
  const community = firstRecord(post.communities);
  const petSpecies = pet?.species || pet?.pet_type;
  const isQuestion = post.post_type === 'question';
  const hasLiked = !!post.hasLiked;
  const likeCount = post.like_count || 0;
  const [showMenu, setShowMenu] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const prevCommentCount = useRef(post.comment_count || 0);

  const commentCount = Math.max(post.comment_count || 0, comments.length);
  const verbSingular = isQuestion ? 'Answer' : getCommentVerb(petSpecies);
  const verbPlural = isQuestion
    ? commentCount === 1
      ? 'Answer'
      : 'Answers'
    : getCommentVerbPlural(petSpecies, commentCount);

  function handleQuestionPress() {
    if (onPress) {
      onPress();
      return;
    }
    if (isQuestion) router.push(`/qa/${post.id}`);
  }

  useEffect(() => {
    const nextCount = post.comment_count || 0;
    const grew = nextCount > prevCommentCount.current;
    prevCommentCount.current = nextCount;
    if (showComments && grew) {
      getComments(post.id)
        .then((list) => {
          setComments(list);
          if (list.length > nextCount) {
            onPatch?.(post.id, { comment_count: list.length });
          }
        })
        .catch(() => {});
    }
  }, [post.comment_count, post.id, showComments, onPatch]);

  const media = Array.isArray(post.media) ? post.media.filter((item) => item?.id && item?.media_url) : [];
  const cardWidth = Dimensions.get('window').width - CARD_GUTTER;
  const authorName = pet?.name || 'Pet';
  const authorHandle = pet?.username ? `@${pet.username}` : '';
  const rawAvatar = asString(pet?.profile_image_url);
  const authorAvatar = rawAvatar.includes('images.unsplash.com') ? '' : rawAvatar;
  const communityName = community?.name;

  async function handleToggleLike() {
    if (!activePet?.id) return;
    const prevLiked = hasLiked;
    const prevCount = likeCount;
    onPatch?.(post.id, {
      hasLiked: !prevLiked,
      like_count: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    });
    try {
      const data = await likePost(post.id, activePet.id);
      onPatch?.(post.id, { hasLiked: data.hasLiked, like_count: data.likeCount });
    } catch {
      onPatch?.(post.id, { hasLiked: prevLiked, like_count: prevCount });
    }
  }

  async function handleToggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setLoadingComments(true);
      try {
        const list = await getComments(post.id);
        setComments(list);
        if (list.length !== (post.comment_count || 0)) {
          onPatch?.(post.id, { comment_count: list.length });
        }
      } catch {
        // Keep the thread empty if fetch fails.
      } finally {
        setLoadingComments(false);
      }
    }
  }

  async function handleAddComment() {
    if (!commentInput.trim() || !activePet?.id || submittingComment) return;
    setSubmittingComment(true);
    const content = commentInput.trim();
    try {
      const data = await createComment(post.id, activePet.id, content);
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        onPatch?.(post.id, {
          comment_count: data.commentCount ?? Math.max(post.comment_count || 0, comments.length) + 1,
        });
        setCommentInput('');
      }
    } catch (err) {
      Alert.alert('Comment', err instanceof Error ? err.message : 'Could not post that comment.');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: post.caption ? `${authorName}: ${post.caption}` : `Check out ${authorName} on Furlo`,
      });
    } catch {
      // User cancelled share sheet.
    }
    setShowMenu(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            style={styles.authorRow}
            onPress={() => {
              if (pet?.id) router.push(`/pet/${pet.id}`);
            }}>
            {authorAvatar ? (
              <Image source={{ uri: authorAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarEmpty}>
                <Ionicons name="paw" size={18} color={palette.amber} />
              </View>
            )}
            <View style={styles.authorText}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{authorName}</Text>
                {isQuestion ? (
                  <Text style={styles.inPack}>
                    {' '}
                    in <Text style={styles.packName}>Q & A</Text>
                  </Text>
                ) : communityName ? (
                  <Text style={styles.inPack}>
                    {' '}
                    in <Text style={styles.packName}>{communityName}</Text>
                  </Text>
                ) : null}
              </View>
              <Text style={styles.meta}>
                {authorHandle}
                {authorHandle ? ' • ' : ''}
                {formatRelativeTime(post.created_at)}
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setShowMenu((v) => !v)} hitSlop={8} style={styles.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={palette.faded} />
          </Pressable>
        </View>

        {isQuestion ? (
          <View style={styles.qaBadges}>
            {post.topic_category ? (
              <View style={styles.topicPill}>
                <Text style={styles.topicText} numberOfLines={1}>
                  🐾 {post.topic_category}
                </Text>
              </View>
            ) : null}
            {post.is_solved ? (
              <View style={styles.solvedPill}>
                <Ionicons name="checkmark-circle" size={12} color="#1E7745" />
                <Text style={styles.solvedText}>Solved</Text>
              </View>
            ) : (
              <View style={styles.questionPill}>
                <Text style={styles.questionText}>Question ?</Text>
              </View>
            )}
          </View>
        ) : null}
        {showMenu ? (
          <View style={styles.menu}>
            <Pressable style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="link-outline" size={16} color={palette.muted} />
              <Text style={styles.menuLabel}>Share</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onReport(post.id);
              }}>
              <Ionicons name="flag-outline" size={16} color="#ba1a1a" />
              <Text style={[styles.menuLabel, { color: '#ba1a1a' }]}>Report Post</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {media.length > 0 ? (
        <View style={{ position: 'relative' }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
              setMediaIndex(next);
            }}>
            {media.map((item) => (
              <Image
                key={item.id}
                source={{ uri: item.media_url }}
                style={{ width: cardWidth, height: 320 }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          {media.length > 1 ? (
            <View style={styles.dots}>
              {media.map((item, idx) => (
                <View key={item.id} style={[styles.dot, idx === mediaIndex && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={handleToggleLike} style={styles.action}>
          <Ionicons name="paw" size={20} color={hasLiked ? palette.amber : '#163328'} />
          <Text style={[styles.actionLabel, hasLiked && { color: palette.amber }]}>
            {likeCount} Treats
          </Text>
        </Pressable>
        <Pressable
          onPress={isQuestion ? handleQuestionPress : handleToggleComments}
          style={styles.action}>
          <Ionicons name="chatbubble-outline" size={18} color="#163328" />
          <Text style={styles.actionLabel}>
            {isQuestion ? `${commentCount} ${verbPlural}` : `${commentCount} ${commentCount === 1 ? verbSingular : verbPlural}`}
          </Text>
        </Pressable>
        <Pressable onPress={handleShare} style={[styles.action, { marginLeft: 'auto' }]}>
          <Ionicons name="share-outline" size={18} color="#163328" />
          <Text style={styles.actionLabel}>Share</Text>
        </Pressable>
      </View>

      {post.caption ? (
        <Pressable onPress={isQuestion ? handleQuestionPress : undefined} disabled={!isQuestion && !onPress}>
          <Text style={styles.caption}>{post.caption}</Text>
        </Pressable>
      ) : null}

      {isQuestion && post.accepted_answer ? (
        <Pressable onPress={handleQuestionPress} style={styles.acceptedPreview}>
          <Text style={styles.acceptedLabel}>★ Accepted Best Answer</Text>
          <Text style={styles.acceptedSnippet} numberOfLines={2}>
            "{post.accepted_answer.content}"
          </Text>
        </Pressable>
      ) : null}

      {showComments ? (
        <View style={styles.comments}>
          {loadingComments ? (
            <ListRowsSkeleton count={2} />
          ) : comments.length === 0 ? (
            <Text style={styles.emptyComments}>No {verbPlural.toLowerCase()} yet.</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                {c.pets?.profile_image_url ? (
                  <Image source={{ uri: c.pets.profile_image_url }} style={styles.commentAvatar} />
                ) : (
                  <View style={[styles.commentAvatar, styles.avatarEmpty]} />
                )}
                <View style={styles.commentBody}>
                  <Text style={styles.commentName}>{c.pets?.name || 'Pet'}</Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
          <View style={styles.commentComposer}>
            <TextInput
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder={`Add a ${verbSingular.toLowerCase()}...`}
              placeholderTextColor={palette.faded}
              style={styles.commentInput}
            />
            <Pressable
              onPress={handleAddComment}
              disabled={submittingComment || !commentInput.trim()}
              style={{ minHeight: TapTarget, justifyContent: 'center' }}>
              {submittingComment ? (
                <ActivityIndicator size="small" color={palette.amber} />
              ) : (
                <Text style={styles.send}>Post</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    overflow: 'hidden',
  },
  header: { padding: 16, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 },
  qaBadges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  topicPill: {
    backgroundColor: palette.tabTrack,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 140,
  },
  topicText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.evergreenSoft },
  solvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E4F5EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  solvedText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#1E7745' },
  questionPill: {
    backgroundColor: palette.apricot,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  questionText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.brown },
  acceptedPreview: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F7FDF4',
    borderWidth: 1.5,
    borderColor: '#84CC16',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  acceptedLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#15803D' },
  acceptedSnippet: {
    fontFamily: AppFonts.body,
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.tabTrack },
  avatarEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ede8e1',
  },
  authorText: { flex: 1 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  name: { fontFamily: AppFonts.heading, fontSize: 16, color: '#163328' },
  inPack: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded },
  packName: { fontFamily: AppFonts.bodySemi, color: palette.forest },
  meta: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded, marginTop: 2 },
  menuBtn: { padding: 6 },
  menu: {
    position: 'absolute',
    right: 12,
    top: 48,
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ede8e1',
    zIndex: 20,
    elevation: 4,
    paddingVertical: 6,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  menuLabel: { fontFamily: AppFonts.body, fontSize: 13, color: palette.muted },
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 8, height: 8, borderRadius: 4 },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(237,232,225,0.4)',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#163328' },
  caption: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontFamily: AppFonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: '#163328',
  },
  comments: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ede8e1',
    backgroundColor: 'rgba(255,251,247,0.6)',
    gap: 10,
  },
  emptyComments: { fontFamily: AppFonts.body, fontSize: 13, color: palette.faded },
  commentRow: { flexDirection: 'row', gap: 8 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: palette.tabTrack },
  commentBody: { flex: 1 },
  commentName: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#163328' },
  commentText: { fontFamily: AppFonts.body, fontSize: 13, color: palette.muted },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ede8e1',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: palette.ink,
    backgroundColor: '#fff',
  },
  send: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.amber },
});
