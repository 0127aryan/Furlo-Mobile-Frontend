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

import { createCommunity } from '@/api/communities';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { compressImage } from '@/lib/compressImage';
import { useAuthStore } from '@/store/useAuthStore';
import type { Community } from '@/types/api';

const CATEGORY_OPTIONS = [
  'Dog Breeds',
  'Local Meetups',
  'Nutrition & Diet',
  'Puppy Training',
  'Senior Dogs',
  'Special Care',
  'General Play',
  'Other',
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (community: Community) => void;
};

export function CreatePackBottomSheet({ visible, onClose, onCreated }: Props) {
  const activePet = useAuthStore((s) => s.activePet);
  const [coverData, setCoverData] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCoverData(null);
    setName('');
    setCategory(CATEGORY_OPTIONS[0]);
    setCustomCategory('');
    setCity('');
    setDescription('');
  }, [visible]);

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    try {
      setCoverData(await compressImage(result.assets[0].uri, 1400, 0.8));
    } catch {
      Alert.alert('Photo', 'Could not process that image.');
    }
  }

  async function submit() {
    if (!activePet?.id) {
      Alert.alert('Pack', 'Finish setting up a Paw Print before creating a pack.');
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert('Pack', 'Give your pack a name.');
      return;
    }
    if (category === 'Other' && !customCategory.trim()) {
      Alert.alert('Category', 'Please enter your custom category name.');
      return;
    }
    setSaving(true);
    try {
      const finalCategory = category === 'Other' ? customCategory.trim() : category;
      const data = await createCommunity({
        petId: activePet.id,
        name: name.trim(),
        category: finalCategory,
        city: city.trim() || undefined,
        description: description.trim(),
        coverData: coverData || undefined,
      });
      onClose();
      Alert.alert(
        'Pack created',
        `Pack "${data.community?.name || name.trim()}" created! Submitted for Super Admin approval & verification. 🐾`,
        [{ text: 'OK', onPress: () => onCreated(data.community) }],
      );
    } catch (err) {
      Alert.alert('Pack', err instanceof Error ? err.message : 'Could not create that pack.');
    } finally {
      setSaving(false);
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
          <Text style={styles.title}>Create a Pack 🐾</Text>
          <Text style={styles.sub}>Gather your people. Name it, tag it, invite the yard.</Text>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Pressable onPress={pickCover} style={styles.coverBox}>
              {coverData ? (
                <Image source={{ uri: coverData }} style={styles.coverImg} />
              ) : (
                <View style={styles.coverEmpty}>
                  <Ionicons name="image-outline" size={28} color={palette.amber} />
                  <Text style={styles.coverHint}>Tap to upload a cover photo</Text>
                </View>
              )}
            </Pressable>

            <Text style={styles.label}>Pack name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Weekend Warriors"
              placeholderTextColor={palette.faded}
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {CATEGORY_OPTIONS.map((item) => {
                const on = category === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
            {category === 'Other' ? (
              <TextInput
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Type custom category (e.g. Agility, Rescue)..."
                placeholderTextColor={palette.faded}
                style={[styles.input, { marginTop: 6 }]}
              />
            ) : null}

            <Text style={styles.label}>City / location (optional)</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Bengaluru, KA"
              placeholderTextColor={palette.faded}
              style={styles.input}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={(text) => setDescription(text.slice(0, 300))}
              placeholder="Tell others what this pack is all about..."
              placeholderTextColor={palette.faded}
              style={[styles.input, styles.area]}
              multiline
            />
            <Text style={styles.counter}>{description.length}/300</Text>

            <Pressable
              onPress={submit}
              disabled={saving}
              style={[styles.submit, { minHeight: TapTarget }, saving && { opacity: 0.7 }]}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Create Pack 🐾</Text>
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
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(1,30,20,0.45)' },
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
  title: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.evergreen, paddingHorizontal: 20 },
  sub: { fontFamily: AppFonts.body, fontSize: 14, color: palette.evergreenSoft, paddingHorizontal: 20, marginTop: 4, marginBottom: 12 },
  body: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  coverBox: {
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.amber,
    backgroundColor: '#fff',
  },
  coverImg: { width: '100%', height: '100%' },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverHint: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.amber },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.evergreenSoft, marginTop: 8, textTransform: 'uppercase' },
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
  area: { minHeight: 96, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontFamily: AppFonts.body, fontSize: 12, color: palette.faded },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  chipOn: { backgroundColor: palette.sage, borderColor: palette.sage },
  chipText: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.evergreenSoft },
  chipTextOn: { color: palette.evergreen },
  submit: {
    marginTop: 8,
    backgroundColor: palette.amber,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontFamily: AppFonts.headingSemi, fontSize: 16, color: '#fff' },
});
