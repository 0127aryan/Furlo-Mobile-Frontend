import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  acceptAnswer,
  createComment,
  getComments,
  getSinglePost,
  likePost,
  markQuestionSolved,
  markQuestionUnsolved,
  unacceptAnswer,
} from '@/api/posts';
import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { QuestionDetailSkeleton } from '@/components/skeletons';
import { AcceptedBestAnswerCard } from '@/components/qa/AcceptedBestAnswerCard';
import { AnswerListItem } from '@/components/qa/AnswerListItem';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/formatTime';
import { applyFeedCounts, applyPostRowCounts, subscribeYardFeed } from '@/lib/subscribeYardFeed';
import { useAuthStore } from '@/store/useAuthStore';
import type { AcceptedAnswer, CommentItem, QuestionDetail } from '@/types/api';

type SortBy = 'upvoted' | 'newest';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activePet = useAuthStore((s) => s.activePet);

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [removingAccepted, setRemovingAccepted] = useState(false);
  const [togglingSolved, setTogglingSolved] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('upvoted');

  const petIdRef = useRef(activePet?.id);
  petIdRef.current = activePet?.id;

  const loadDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [post, commentList] = await Promise.all([
        getSinglePost(id, activePet?.id),
        getComments(id),
      ]);
      setQuestion(post);
      setComments(commentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  }, [id, activePet?.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    if (!id) return;
    return subscribeYardFeed({
      onCounts: (payload) => {
        if (payload.postId !== id) return;
        setQuestion((prev) => {
          if (!prev) return prev;
          return applyFeedCounts([prev], payload, petIdRef.current)[0];
        });
      },
      onPostRow: (row) => {
        if (row.id !== id) return;
        setQuestion((prev) => {
          if (!prev) return prev;
          return applyPostRowCounts([prev], row)[0];
        });
      },
    });
  }, [id]);

  async function handleToggleLike() {
    if (!activePet?.id || !question) return;
    const prevLiked = !!question.hasLiked;
    const prevCount = question.like_count || 0;
    setQuestion((prev) =>
      prev
        ? {
            ...prev,
            hasLiked: !prevLiked,
            like_count: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
          }
        : prev
    );
    try {
      const data = await likePost(question.id, activePet.id);
      setQuestion((prev) =>
        prev ? { ...prev, hasLiked: data.hasLiked, like_count: data.likeCount } : prev
      );
    } catch {
      setQuestion((prev) =>
        prev ? { ...prev, hasLiked: prevLiked, like_count: prevCount } : prev
      );
    }
  }

  const isQuestionOwner = Boolean(
    activePet?.id && question?.pets?.id && activePet.id === question.pets.id
  );

  async function handlePostAnswer() {
    if (!answerInput.trim() || submittingAnswer || !id) return;
    if (!activePet?.id) {
      Alert.alert('Answer', 'Finish setting up a Paw Print before answering.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const res = await createComment(id, activePet.id, answerInput.trim());
      if (res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setQuestion((prev) =>
          prev ? { ...prev, comment_count: res.commentCount ?? prev.comment_count + 1 } : prev
        );
        setAnswerInput('');
      }
    } catch (err) {
      Alert.alert('Answer', err instanceof Error ? err.message : 'Could not post answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  }

  function commentToAcceptedAnswer(comment: CommentItem): AcceptedAnswer {
    return {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      pets: comment.pets,
    };
  }

  async function performAcceptAnswer(commentId: string) {
    if (!activePet?.id || !question) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const previousQuestion = question;
    setAcceptingId(commentId);
    setQuestion((prev) =>
      prev
        ? {
            ...prev,
            accepted_answer_id: commentId,
            accepted_answer: commentToAcceptedAnswer(comment),
          }
        : prev
    );

    try {
      await acceptAnswer(question.id, activePet.id, commentId);
      Alert.alert('Best Answer', 'Marked as Accepted Best Answer! ⭐');
      await loadDetails();
    } catch (err) {
      setQuestion(previousQuestion);
      Alert.alert('Best Answer', err instanceof Error ? err.message : 'Could not accept answer.');
    } finally {
      setAcceptingId(null);
    }
  }

  function promptAcceptAnswer(commentId: string) {
    if (!question) return;

    const hasBestAnswer = !!question.accepted_answer_id;
    const title = hasBestAnswer ? 'Change Best Answer' : 'Accept Best Answer';
    const message = hasBestAnswer
      ? 'Replace the current best answer with this one?'
      : 'Mark this answer as the accepted best answer?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: hasBestAnswer ? 'Change' : 'Accept',
        onPress: () => performAcceptAnswer(commentId),
      },
    ]);
  }

  async function performUnacceptAnswer() {
    if (!activePet?.id || !question) return;

    const previousQuestion = question;
    setRemovingAccepted(true);
    setQuestion((prev) =>
      prev
        ? {
            ...prev,
            accepted_answer_id: null,
            accepted_answer: null,
          }
        : prev
    );

    try {
      await unacceptAnswer(question.id, activePet.id);
      Alert.alert('Best Answer', 'Removed Best Answer status 🐾');
      await loadDetails();
    } catch (err) {
      setQuestion(previousQuestion);
      Alert.alert('Best Answer', err instanceof Error ? err.message : 'Could not remove best answer.');
    } finally {
      setRemovingAccepted(false);
    }
  }

  function promptUnacceptAnswer() {
    Alert.alert(
      'Remove Best Answer',
      'Remove the accepted best answer from this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: performUnacceptAnswer },
      ]
    );
  }

  async function performMarkSolved() {
    if (!activePet?.id || !question) return;

    const previousQuestion = question;
    setTogglingSolved(true);
    setQuestion((prev) => (prev ? { ...prev, is_solved: true } : prev));

    try {
      await markQuestionSolved(question.id, activePet.id);
      Alert.alert('Question', 'Marked as solved ✓');
      await loadDetails();
    } catch (err) {
      setQuestion(previousQuestion);
      Alert.alert('Question', err instanceof Error ? err.message : 'Could not mark as solved.');
    } finally {
      setTogglingSolved(false);
    }
  }

  async function performMarkUnsolved() {
    if (!activePet?.id || !question) return;

    const previousQuestion = question;
    setTogglingSolved(true);
    setQuestion((prev) => (prev ? { ...prev, is_solved: false } : prev));

    try {
      await markQuestionUnsolved(question.id, activePet.id);
      Alert.alert('Question', 'Marked as unsolved — question reopened 🐾');
      await loadDetails();
    } catch (err) {
      setQuestion(previousQuestion);
      Alert.alert('Question', err instanceof Error ? err.message : 'Could not mark as unsolved.');
    } finally {
      setTogglingSolved(false);
    }
  }

  function promptMarkSolved() {
    Alert.alert(
      'Mark as Solved',
      'Mark this question as solved? This is independent of the best answer.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Solved', onPress: performMarkSolved },
      ]
    );
  }

  function promptMarkUnsolved() {
    Alert.alert(
      'Mark as Unsolved',
      'Reopen this question as unsolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Unsolved', style: 'destructive', onPress: performMarkUnsolved },
      ]
    );
  }

  const listComments = [...comments]
    .filter((c) => c.id !== question?.accepted_answer_id)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return (b.like_count || 0) - (a.like_count || 0);
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <ScreenBackButton fallbackHref="/qa" />
        {question?.topic_category ? (
          <View style={styles.topicPill}>
            <Text style={styles.topicText}>🐾 {question.topic_category}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <QuestionDetailSkeleton />
        </View>
      ) : error || !question ? (
        <View style={styles.center}>
          <Ionicons name="help-circle-outline" size={48} color={palette.brown} />
          <Text style={styles.errorTitle}>{error || 'Question not found'}</Text>
          <Pressable onPress={() => router.back()} style={styles.errorCta}>
            <Text style={styles.errorCtaText}>Back to Q&A Hub</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 88 }]}
            keyboardShouldPersistTaps="handled">
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.authorRow}>
                  {question.pets?.profile_image_url ? (
                    <Image source={{ uri: question.pets.profile_image_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarEmpty}>
                      <Ionicons name="paw" size={18} color={palette.amber} />
                    </View>
                  )}
                  <View style={styles.authorMeta}>
                    <Text style={styles.authorName}>{question.pets?.name || 'Pet Parent'}</Text>
                    <Text style={styles.authorSub}>
                      @{question.pets?.username || 'pet'} · Asked {formatRelativeTime(question.created_at)} ·{' '}
                      {question.location_city || 'Bangalore'}
                    </Text>
                  </View>
                </View>
                {question.is_solved ? (
                  <View style={styles.solvedPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#166534" />
                    <Text style={styles.solvedText}>Solved</Text>
                  </View>
                ) : (
                  <View style={styles.questionPill}>
                    <Text style={styles.questionPillText}>Question ?</Text>
                  </View>
                )}
              </View>

              <Text style={styles.caption}>{question.caption}</Text>

              {question.media && question.media.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
                  {question.media.map((img) => (
                    <Image key={img.id} source={{ uri: img.media_url }} style={styles.mediaImg} />
                  ))}
                </ScrollView>
              ) : null}

              <View style={styles.statsRow}>
                <Pressable onPress={handleToggleLike} style={styles.likeBtn}>
                  <Ionicons
                    name="paw"
                    size={18}
                    color={question.hasLiked ? palette.amber : palette.evergreen}
                  />
                  <Text style={[styles.stat, question.hasLiked && styles.statLiked]}>
                    {question.like_count || 0} Treats
                  </Text>
                </Pressable>
                <Text style={styles.stat}>{comments.length} Answers</Text>
              </View>

              {isQuestionOwner ? (
                <View style={styles.ownerActions}>
                  {question.is_solved ? (
                    <Pressable
                      onPress={promptMarkUnsolved}
                      disabled={togglingSolved}
                      style={[styles.markUnsolvedBtn, togglingSolved && { opacity: 0.6 }]}>
                      {togglingSolved ? (
                        <ActivityIndicator size="small" color={palette.brown} />
                      ) : (
                        <>
                          <Ionicons name="help-circle-outline" size={16} color={palette.brown} />
                          <Text style={styles.markUnsolvedText}>Mark as Unsolved</Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={promptMarkSolved}
                      disabled={togglingSolved}
                      style={[styles.markSolvedBtn, togglingSolved && { opacity: 0.6 }]}>
                      {togglingSolved ? (
                        <ActivityIndicator size="small" color="#166534" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#166534" />
                          <Text style={styles.markSolvedText}>Mark as Solved</Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>

            {question.accepted_answer ? (
              <AcceptedBestAnswerCard
                answer={question.accepted_answer}
                isQuestionOwner={isQuestionOwner}
                removing={removingAccepted}
                onRemove={promptUnacceptAnswer}
              />
            ) : null}

            <View style={styles.answersSection}>
              <View style={styles.answersHeader}>
                <Text style={styles.answersTitle}>
                  {comments.length} {comments.length === 1 ? 'Answer' : 'Answers'}
                </Text>
                <View style={styles.sortRow}>
                  <Pressable onPress={() => setSortBy('upvoted')} style={styles.sortBtn}>
                    <Text style={[styles.sortText, sortBy === 'upvoted' && styles.sortTextActive]}>
                      Most Upvoted
                    </Text>
                    {sortBy === 'upvoted' ? <View style={styles.sortUnderline} /> : null}
                  </Pressable>
                  <Pressable onPress={() => setSortBy('newest')} style={styles.sortBtn}>
                    <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>
                      Newest
                    </Text>
                    {sortBy === 'newest' ? <View style={styles.sortUnderline} /> : null}
                  </Pressable>
                </View>
              </View>

              {listComments.length === 0 ? (
                <View style={styles.noAnswers}>
                  <Text style={styles.noAnswersText}>
                    No answers written yet. Be the first pet to help out! 🐾
                  </Text>
                </View>
              ) : (
                listComments.map((c) => (
                  <AnswerListItem
                    key={c.id}
                    comment={c}
                    isQuestionOwner={isQuestionOwner}
                    hasAcceptedAnswer={!!question.accepted_answer_id}
                    accepting={acceptingId === c.id}
                    onAccept={() => promptAcceptAnswer(c.id)}
                  />
                ))
              )}
            </View>
          </ScrollView>

          <View style={[styles.answerBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {activePet?.profile_image_url ? (
              <Image source={{ uri: activePet.profile_image_url }} style={styles.barAvatar} />
            ) : (
              <View style={styles.barAvatarEmpty}>
                <Ionicons name="paw" size={16} color={palette.amber} />
              </View>
            )}
            <TextInput
              value={answerInput}
              onChangeText={setAnswerInput}
              placeholder={`Write your answer for ${question.pets?.name || 'this question'}...`}
              placeholderTextColor={palette.faded}
              style={styles.answerInput}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handlePostAnswer}
              disabled={submittingAnswer || !answerInput.trim()}
              style={[styles.postBtn, (submittingAnswer || !answerInput.trim()) && { opacity: 0.5 }]}>
              {submittingAnswer ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.postBtnText}>Post Answer 🐾</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
    backgroundColor: '#FAF7F2',
  },
  topicPill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  topicText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.evergreenSoft },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  skeletonWrap: { flex: 1, padding: 16 },
  loadingText: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded },
  errorTitle: { fontFamily: AppFonts.heading, fontSize: 18, color: palette.evergreen, textAlign: 'center' },
  errorCta: {
    backgroundColor: palette.amber,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: TapTarget,
    justifyContent: 'center',
  },
  errorCtaText: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#fff' },
  scroll: { padding: 16, gap: 16 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE6DE',
    padding: 20,
    gap: 12,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  authorMeta: { flex: 1 },
  authorName: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: palette.evergreen },
  authorSub: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded, marginTop: 2 },
  solvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E4F5EB',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  solvedText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#166534' },
  questionPill: {
    backgroundColor: palette.apricot,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  questionPillText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.brown },
  caption: {
    fontFamily: AppFonts.headingSemi,
    fontSize: 20,
    color: '#011E14',
    lineHeight: 28,
  },
  mediaRow: { gap: 10 },
  mediaImg: { width: 200, height: 160, borderRadius: 16, borderWidth: 1, borderColor: palette.cardLine },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.cardLine,
  },
  stat: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.faded },
  statLiked: { color: palette.amber },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerActions: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.cardLine,
  },
  markSolvedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E4F5EB',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    minHeight: TapTarget,
  },
  markSolvedText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#166534' },
  markUnsolvedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.apricot,
    borderWidth: 1,
    borderColor: '#F5C4A8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    minHeight: TapTarget,
  },
  markUnsolvedText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.brown },
  answersSection: { gap: 12, paddingTop: 4 },
  answersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
  },
  answersTitle: { fontFamily: AppFonts.headingSemi, fontSize: 17, color: '#011E14' },
  sortRow: { flexDirection: 'row', gap: 12 },
  sortBtn: { alignItems: 'center', gap: 4, paddingBottom: 4 },
  sortText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#727974' },
  sortTextActive: { color: '#011E14' },
  sortUnderline: { height: 2, alignSelf: 'stretch', backgroundColor: '#011E14', borderRadius: 1 },
  noAnswers: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 32,
    alignItems: 'center',
  },
  noAnswersText: { fontFamily: AppFonts.body, fontSize: 14, color: '#727974', textAlign: 'center' },
  answerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: palette.cardLine,
  },
  barAvatar: { width: 40, height: 40, borderRadius: 20 },
  barAvatarEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  answerInput: {
    flex: 1,
    backgroundColor: '#F9F7F4',
    borderWidth: 1,
    borderColor: palette.cardLine,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: AppFonts.body,
    fontSize: 13,
    color: palette.evergreen,
    maxHeight: 80,
  },
  postBtn: {
    backgroundColor: palette.amber,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minHeight: TapTarget,
    justifyContent: 'center',
  },
  postBtnText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
});
