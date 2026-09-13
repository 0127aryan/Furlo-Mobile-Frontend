import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createPost } from '@/api/posts';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { compressImage } from '@/lib/compressImage';
import { useAuthStore } from '@/store/useAuthStore';
import type { Post } from '@/types/api';

const TOPIC_CATEGORIES = [
  { id: 'Health', label: 'Health', icon: '🏥' },
  { id: 'Diet', label: 'Diet', icon: '🥗' },
  { id: 'Training', label: 'Training', icon: '🎾' },
  { id: 'Behavior', label: 'Behavior', icon: '🐾' },
  { id: 'General', label: 'General', icon: '💬' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (post: Post) => void;
};

export function AskQuestionBottomSheet({ visible, onClose, onSuccess }: Props) {
  const activePet = useAuthStore((s) => s.activePet);
  const [caption, setCaption] = useState('');
  const [topicCategory, setTopicCategory] = useState('Health');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCaption('');
    setTopicCategory('Health');
    setMediaFiles([]);
  }, [visible]);

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

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!caption.trim()) {
      Alert.alert('Question', 'Please enter your question.');
      return;
    }
    if (!activePet?.id) {
      Alert.alert('Question', 'Finish setting up a Paw Print before asking.');
      return;
    }

    setSubmitting(true);
    try {
      const post = await createPost({
        petId: activePet.id,
        caption: caption.trim(),
        postType: 'question',
        topicCategory,
        mediaData: mediaFiles,
      });
      onSuccess(post);
      onClose();
    } catch (err) {
      Alert.alert('Question', err instanceof Error ? err.message : 'Could not publish your question.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Ask a Question 🐾</Text>
          <Text style={styles.sub}>Get advice from experienced pet parents</Text>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.petRow}>
              {activePet?.profile_image_url ? (
                <Image source={{ uri: activePet.profile_image_url }} style={styles.petAvatar} />
              ) : (
                <View style={styles.petAvatarEmpty}>
                  <Ionicons name="paw" size={16} color={palette.amber} />
                </View>
              )}
              <Text style={styles.petName}>
                Asking as <Text style={styles.petNameBold}>{activePet?.name || 'My Pet'}</Text>
              </Text>
            </View>

            <Text style={styles.label}>YOUR QUESTION *</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="e.g. Is it normal for a puppy to refuse dry kibble?"
              placeholderTextColor={palette.faded}
              style={[styles.input, styles.area]}
              multiline
              maxLength={1000}
            />

            <Text style={styles.label}>CATEGORY *</Text>
            <View style={styles.chips}>
              {TOPIC_CATEGORIES.map((cat) => {
                const selected = topicCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setTopicCategory(cat.id)}
                    style={[styles.chip, selected && styles.chipOn]}>
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                      {cat.icon} {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>PHOTOS (OPTIONAL)</Text>
            {mediaFiles.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
                {mediaFiles.map((uri, idx) => (
                  <View key={idx} style={styles.mediaThumb}>
                    <Image source={{ uri }} style={styles.mediaImg} />
                    <Pressable onPress={() => removeMedia(idx)} style={styles.mediaRemove}>
                      <Ionicons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            {mediaFiles.length < 5 ? (
              <Pressable onPress={pickImages} style={styles.uploadBox}>
                <Ionicons name="camera-outline" size={24} color={palette.amber} />
                <Text style={styles.uploadText}>Tap to add photos</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={submitting || !caption.trim()}
              style={[styles.submit, { minHeight: TapTarget }, (submitting || !caption.trim()) && { opacity: 0.6 }]}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Publish Question 🚀</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(1,30,20,0.45)' },
  sheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: palette.cardLine,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  title: { fontFamily: AppFonts.heading, fontSize: 22, color: palette.evergreen, paddingHorizontal: 20 },
  sub: {
    fontFamily: AppFonts.body,
    fontSize: 13,
    color: palette.faded,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  body: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  petAvatar: { width: 32, height: 32, borderRadius: 16 },
  petAvatarEmpty: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: { fontFamily: AppFonts.body, fontSize: 14, color: palette.evergreenSoft },
  petNameBold: { fontFamily: AppFonts.bodySemi, color: palette.evergreen },
  label: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    color: palette.faded,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: AppFonts.body,
    fontSize: 15,
    color: palette.evergreen,
  },
  area: { minHeight: 100, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  chipOn: { backgroundColor: palette.evergreenSoft, borderColor: palette.evergreenSoft },
  chipText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.evergreenSoft },
  chipTextOn: { color: '#fff' },
  mediaRow: { gap: 8, paddingVertical: 4 },
  mediaThumb: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  mediaImg: { width: '100%', height: '100%' },
  mediaRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.cardLine,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
  },
  uploadText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.amber },
  submit: {
    marginTop: 12,
    backgroundColor: palette.amber,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontFamily: AppFonts.headingSemi, fontSize: 16, color: '#fff' },
});
