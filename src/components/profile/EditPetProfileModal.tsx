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

import { updatePetProfile } from '@/api/auth';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { compressImage } from '@/lib/compressImage';
import { useAuthStore } from '@/store/useAuthStore';
import type { Pet } from '@/types/api';

type Props = {
  visible: boolean;
  pet: Pet;
  onClose: () => void;
  onSuccess: (pet: Pet) => void;
};

export function EditPetProfileModal({ visible, pet, onClose, onSuccess }: Props) {
  const setActivePet = useAuthStore((s) => s.setActivePet);
  const activePet = useAuthStore((s) => s.activePet);

  const [name, setName] = useState(pet.name);
  const [username, setUsername] = useState(pet.username || '');
  const [breed, setBreed] = useState(pet.breed || '');
  const [city, setCity] = useState(pet.city || '');
  const [bio, setBio] = useState(pet.bio || '');
  const [tagsText, setTagsText] = useState((pet.personality_tags || []).join(', '));
  const [previewUrl, setPreviewUrl] = useState(pet.profile_image_url || '');
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(pet.name);
    setUsername(pet.username || '');
    setBreed(pet.breed || '');
    setCity(pet.city || '');
    setBio(pet.bio || '');
    setTagsText((pet.personality_tags || []).join(', '));
    setPreviewUrl(pet.profile_image_url || '');
    setAvatarData(null);
    setRemoveAvatar(false);
  }, [visible, pet]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    try {
      const dataUrl = await compressImage(result.assets[0].uri, 800, 0.8);
      setAvatarData(dataUrl);
      setPreviewUrl(dataUrl);
      setRemoveAvatar(false);
    } catch {
      Alert.alert('Photo', 'Could not process that image. Try another one.');
    }
  }

  async function handleSave() {
    if (!name.trim() || !city.trim()) {
      Alert.alert('Profile', 'Name and city are required.');
      return;
    }
    setSaving(true);
    try {
      const personalityTags = tagsText
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean);
      const data = await updatePetProfile({
        petId: pet.id,
        name: name.trim(),
        username: username.trim(),
        breed: breed.trim(),
        city: city.trim(),
        bio: bio.trim(),
        personalityTags,
        ...(removeAvatar
          ? { removeAvatar: true, avatarData: '' }
          : avatarData
            ? { avatarData }
            : {}),
      });
      if (activePet?.id === data.pet.id) {
        setActivePet({ ...activePet, ...data.pet });
      }
      onSuccess(data.pet);
      onClose();
    } catch (err) {
      Alert.alert('Profile', err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Pet Profile</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={palette.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarBlock}>
            {previewUrl ? (
              <Image source={{ uri: previewUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarEmpty}>
                <Ionicons name="paw" size={36} color={palette.amber} />
              </View>
            )}
            <View style={styles.photoRow}>
              <Pressable onPress={pickPhoto}>
                <Text style={styles.photoAction}>{previewUrl ? 'Change Photo' : 'Upload Photo'}</Text>
              </Pressable>
              {previewUrl ? (
                <Pressable
                  onPress={() => {
                    setPreviewUrl('');
                    setAvatarData('');
                    setRemoveAvatar(true);
                  }}>
                  <Text style={styles.removePhoto}>Remove Photo</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Field label="Pet Name" value={name} onChangeText={setName} />
          <Field label="Username Handle" value={username} onChangeText={setUsername} placeholder="e.g. bruno_the_lab" />
          <Field label="Breed" value={breed} onChangeText={setBreed} />
          <Field label="City" value={city} onChangeText={setCity} />
          <Field
            label="Personality Tags (comma separated)"
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="Active, Playful, Cuddly"
          />
          <Field label="Bio" value={bio} onChangeText={setBio} multiline placeholder="Share what makes your companion special..." />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.save, { minHeight: TapTarget, opacity: saving ? 0.6 : 1 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveLabel}>Save Changes</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.faded}
        multiline={multiline}
        maxLength={multiline ? 300 : 80}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FEF9F3' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E1',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: AppFonts.heading, fontSize: 20, color: '#011E14' },
  closeBtn: { padding: 6 },
  body: { padding: 20, gap: 14, paddingBottom: 32 },
  avatarBlock: { alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: palette.tabTrack },
  avatarEmpty: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRow: { flexDirection: 'row', gap: 16 },
  photoAction: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.amber },
  removePhoto: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#ba1a1a' },
  field: { gap: 6 },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#424844' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: '#011E14',
  },
  textarea: { borderRadius: 16, minHeight: 88, textAlignVertical: 'top' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDE8E1',
    backgroundColor: '#fff',
  },
  cancel: { paddingHorizontal: 16, justifyContent: 'center' },
  cancelLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#424844' },
  save: {
    backgroundColor: palette.amber,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
});
