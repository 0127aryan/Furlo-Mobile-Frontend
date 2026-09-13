import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createPost } from '@/api/posts';
import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { compressImage } from '@/lib/compressImage';
import { usePostVerb } from '@/hooks/usePostVerb';
import { useAuthStore } from '@/store/useAuthStore';
import type { Community, Post } from '@/types/api';

type PostType = 'regular' | 'question' | 'advice' | 'meme';

const POST_TYPES: { id: PostType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'regular', label: 'Photo Moment', icon: 'camera-outline' },
  { id: 'question', label: 'Question / Advice', icon: 'help-circle-outline' },
  { id: 'advice', label: 'Tip', icon: 'bulb-outline' },
  { id: 'meme', label: 'Meme', icon: 'happy-outline' },
];

type Props = {
  communities: Community[];
  lockedCommunityId?: string;
  onSuccess: (post: Post) => void;
  onCancel?: () => void;
};

export function CreatePostForm({ communities, lockedCommunityId, onSuccess, onCancel }: Props) {
  const activePet = useAuthStore((s) => s.activePet);
  const user = useAuthStore((s) => s.user);
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState<PostType>('regular');
  const [communityId, setCommunityId] = useState(lockedCommunityId || '');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleName = activePet?.username
    ? `@${activePet.username}`
    : user?.email?.split('@')[0] || '@user';
  const { verb } = usePostVerb(activePet);

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (result.canceled) return;
    const remaining = 5 - mediaFiles.length;
    const picked = result.assets.slice(0, remaining);
    const compressed: string[] = [];
    for (const asset of picked) {
      try {
        compressed.push(await compressImage(asset.uri, 1200, 0.8));
      } catch {
        Alert.alert('Photo', 'Could not process one of those images.');
      }
    }
    setMediaFiles((prev) => [...prev, ...compressed].slice(0, 5));
  }

  async function handleSubmit() {
    if (!activePet?.id) {
      Alert.alert('Post', 'Finish setting up a Paw Print before posting.');
      return;
    }
    setSubmitting(true);
    try {
      const post = await createPost({
        petId: activePet.id,
        communityId: (lockedCommunityId || communityId) || null,
        caption,
        postType,
        mediaData: mediaFiles,
      });
      if (post) {
        setCaption('');
        setMediaFiles([]);
        setCommunityId('');
        setPostType('regular');
        onSuccess(post);
      }
    } catch (err) {
      Alert.alert('Post', err instanceof Error ? err.message : 'Could not create that post.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        {onCancel ? <ScreenBackButton onPress={onCancel} /> : <View style={styles.backSpacer} />}
        <View style={styles.headerText}>
          <Text style={styles.title}>Create a Post</Text>
          <Text style={styles.sub}>
            Posting as <Text style={styles.as}>{handleName}</Text>
          </Text>
        </View>
      </View>

      {!lockedCommunityId ? (
        <>
          <Text style={styles.label}>POST TO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            <Pressable
              onPress={() => setCommunityId('')}
              style={[styles.pill, !communityId && styles.pillOn]}>
              <Text style={[styles.pillText, !communityId && styles.pillTextOn]}>Public Yard</Text>
            </Pressable>
            {communities.map((c) => {
              const on = communityId === c.id;
              return (
                <Pressable key={c.id} onPress={() => setCommunityId(c.id)} style={[styles.pill, on && styles.pillOn]}>
                  <Text style={[styles.pillText, on && styles.pillTextOn]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <Text style={styles.label}>POST TYPE</Text>
      <View style={styles.pillsWrap}>
        {POST_TYPES.map((type) => {
          const on = postType === type.id;
          return (
            <Pressable key={type.id} onPress={() => setPostType(type.id)} style={[styles.typePill, on && styles.pillOn]}>
              <Ionicons name={type.icon} size={16} color={on ? palette.brown : palette.muted} />
              <Text style={[styles.pillText, on && styles.pillTextOn]}>{type.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View>
        <TextInput
          value={caption}
          onChangeText={(v) => setCaption(v.slice(0, 500))}
          placeholder={`What's ${activePet?.name || 'your pet'} up to today?`}
          placeholderTextColor={palette.faded}
          multiline
          style={styles.caption}
        />
        <Text style={styles.counter}>{caption.length}/500</Text>
      </View>

      {mediaFiles.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.previews}>
          {mediaFiles.map((uri, idx) => (
            <View key={`${idx}-${uri.slice(-12)}`} style={styles.preview}>
              <Image source={{ uri }} style={styles.previewImg} />
              <Pressable
                style={styles.remove}
                onPress={() => setMediaFiles((prev) => prev.filter((_, i) => i !== idx))}>
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {mediaFiles.length < 5 ? (
        <Pressable onPress={pickImages} style={styles.drop}>
          <Ionicons name="image-outline" size={28} color={palette.amber} />
          <Text style={styles.dropTitle}>Add photos</Text>
          <Text style={styles.dropHint}>Up to 5 images</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={StyleSheet.flatten([styles.cta, { minHeight: TapTarget + 8, opacity: submitting ? 0.7 : 1 }])}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaLabel}>Post {verb}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  headerText: { flex: 1 },
  backSpacer: { width: TapTarget },
  title: { fontFamily: AppFonts.heading, fontSize: 20, color: '#163328' },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: palette.muted, marginTop: 4 },
  as: { fontFamily: AppFonts.bodySemi, color: palette.amber },
  label: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: palette.faded,
    marginTop: 4,
  },
  pills: { gap: 8 },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#fff',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#fff',
  },
  pillOn: { backgroundColor: 'rgba(232,132,58,0.1)', borderColor: palette.amber },
  pillText: { fontFamily: AppFonts.bodyMedium, fontSize: 13, color: palette.muted },
  pillTextOn: { fontFamily: AppFonts.bodySemi, color: palette.brown },
  caption: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 28,
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: '#163328',
    backgroundColor: palette.cream,
    textAlignVertical: 'top',
  },
  counter: { position: 'absolute', right: 12, bottom: 10, fontFamily: AppFonts.body, fontSize: 11, color: palette.faded },
  previews: { gap: 8 },
  preview: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(22,51,40,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drop: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.border,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254,249,243,0.5)',
  },
  dropTitle: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#163328' },
  dropHint: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded },
  cta: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { fontFamily: AppFonts.headingSemi, fontSize: 16, color: '#fff' },
});
