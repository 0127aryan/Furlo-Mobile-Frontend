import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

const PARENT_TAGS = [
  'Active',
  'Playful',
  'Friendly',
  'Lazy',
  'Foodie',
  'Adventurous',
  'Cuddly',
  'Stubborn',
  'Gentle',
  'Loud',
  'Shy',
  'Protective',
  'Sassy',
  'Calm',
  'Social',
];

const LOVER_TAGS = [
  'Pet Advocate',
  'Adoption Advocate',
  'Dog Lover',
  'Cat Lover',
  'Volunteer',
  'Foster Parent',
  'Dog Walker',
  'Rescuer',
  'Photographer',
  'Trainer',
];

const CHAR_MAX = 300;

export default function JoinBioScreen() {
  const router = useRouter();
  const onboardingData = useAuthStore((s) => s.onboardingData);
  const setOnboardingData = useAuthStore((s) => s.setOnboardingData);
  const role = onboardingData?.role || 'parent';

  const [bio, setBio] = useState(onboardingData?.bio || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(onboardingData?.personalityTags || []);
  const [customTags, setCustomTags] = useState<string[]>(onboardingData?.customPersonalityTags || []);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(
    (onboardingData?.customPersonalityTags || []).length > 0
  );
  const [bioFocused, setBioFocused] = useState(false);

  const tags = role === 'parent' ? PARENT_TAGS : LOVER_TAGS;

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function addCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (customTags.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCustomTagInput('');
      return;
    }
    setCustomTags((prev) => [...prev, trimmed]);
    setSelectedTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomTagInput('');
  }

  function removeCustomTag(tagToRemove: string) {
    setCustomTags((prev) => prev.filter((t) => t !== tagToRemove));
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  }

  function persistAndContinue() {
    setOnboardingData({
      bio,
      personalityTags: selectedTags,
      customPersonalityTags: customTags,
    });
    router.push('/join/packs');
  }

  return (
    <OnboardingShell step={3} rightLabel="Skip" onBack={() => router.back()} onRightPress={() => router.push('/join/packs')}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <Text style={styles.stepTiny}>Step 3 of 4</Text>
            <Text style={styles.percent}>75%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: '75%' }]} />
          </View>

          <Text style={styles.title}>{role === 'parent' ? "What's their vibe?" : 'What makes you tick?'}</Text>
          <Text style={styles.subtitle}>
            {role === 'parent'
              ? "Give the pack a feel for your pet's personality."
              : 'Help others find you in the pack.'}
          </Text>

          <View>
            <TextInput
              value={bio}
              onChangeText={(v) => setBio(v.slice(0, CHAR_MAX))}
              multiline
              maxLength={CHAR_MAX}
              placeholder={
                role === 'parent'
                  ? "Tell the Pack about your pet's favorite snacks, funny quirks, or how they spend their Sundays..."
                  : 'Tell the pack what you love about animals, your experience, or your rescue story...'
              }
              placeholderTextColor={palette.border}
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              style={[styles.bio, bioFocused && styles.bioFocused]}
            />
            <Text style={styles.counter}>
              {bio.length}/{CHAR_MAX}
            </Text>
          </View>

          <Text style={styles.label}>{role === 'parent' ? 'Personality Tags' : 'Interests'}</Text>
          <Text style={styles.hint}>Pick a few that fit.</Text>

          <View style={styles.tagWrap}>
            {tags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tag, active && styles.tagActive]}>
                  <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>{tag}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setShowOtherInput((v) => !v)}
              style={[styles.tag, (showOtherInput || customTags.length > 0) && styles.tagActive]}>
              <Text
                style={[
                  styles.tagLabel,
                  (showOtherInput || customTags.length > 0) && styles.tagLabelActive,
                ]}>
                + Other
              </Text>
            </Pressable>
          </View>

          {(showOtherInput || customTags.length > 0) && (
            <View style={styles.customBox}>
              <Text style={styles.customLabel}>
                Add Custom {role === 'parent' ? 'Personality Tags' : 'Interests'}
              </Text>
              <View style={styles.customRow}>
                <TextInput
                  value={customTagInput}
                  onChangeText={setCustomTagInput}
                  placeholder="Type custom tag (e.g. Goofy, Barker)..."
                  placeholderTextColor={palette.border}
                  onSubmitEditing={addCustomTag}
                  style={styles.customInput}
                />
                <Pressable onPress={addCustomTag} style={styles.addBtn}>
                  <Text style={styles.addLabel}>Add</Text>
                </Pressable>
              </View>
              <View style={styles.tagWrap}>
                {customTags.map((ctag) => (
                  <View key={ctag} style={styles.customChip}>
                    <Text style={styles.tagLabelActive}>{ctag}</Text>
                    <Pressable onPress={() => removeCustomTag(ctag)} hitSlop={8}>
                      <Ionicons name="close" size={14} color={palette.brown} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <Text style={styles.tiny}>
                Custom tags will be added to your profile & submitted for admin catalog approval.
              </Text>
            </View>
          )}

          {selectedTags.length > 0 ? (
            <Text style={styles.selectedCount}>
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </Text>
          ) : null}

          <Pressable
            onPress={persistAndContinue}
            style={StyleSheet.flatten([styles.cta, { minHeight: TapTarget + 12 }])}>
            <Text style={styles.ctaLabel}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => router.push('/join/packs')}>
            <Text style={styles.skip}>Skip for now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.cream,
    padding: 24,
    gap: 12,
  },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepTiny: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
  },
  percent: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.mutedGreen },
  barTrack: { height: 8, borderRadius: 99, backgroundColor: '#ece7e2', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: palette.amber, borderRadius: 99 },
  title: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.forest, marginTop: 8 },
  subtitle: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, marginTop: -4 },
  bio: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 28,
    color: palette.ink,
    fontFamily: AppFonts.body,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  bioFocused: { borderColor: palette.brown },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    fontFamily: AppFonts.body,
    fontSize: 11,
    color: palette.faded,
  },
  label: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.mutedGreen,
    marginTop: 8,
  },
  hint: { fontFamily: AppFonts.body, fontSize: 12, color: palette.muted, marginTop: -6 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
  },
  tagActive: { backgroundColor: 'rgba(232,132,58,0.1)', borderColor: palette.amber },
  tagLabel: { fontFamily: AppFonts.body, fontSize: 13, color: palette.muted },
  tagLabelActive: { fontFamily: AppFonts.bodySemi, color: palette.brown },
  customBox: {
    borderWidth: 1,
    borderColor: palette.amber,
    backgroundColor: '#fffbf7',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  customLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.brown,
  },
  customRow: { flexDirection: 'row', gap: 8 },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: AppFonts.body,
    fontSize: 13,
    color: palette.ink,
    backgroundColor: '#fff',
  },
  addBtn: {
    backgroundColor: palette.brown,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(232,132,58,0.2)',
    borderWidth: 1,
    borderColor: palette.amber,
  },
  tiny: { fontFamily: AppFonts.body, fontSize: 10, color: palette.faded },
  selectedCount: { fontFamily: AppFonts.bodyMedium, fontSize: 12, color: palette.mutedGreen },
  cta: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: palette.amber,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: { fontFamily: AppFonts.headingSemi, fontSize: 16, color: '#fff' },
  skip: {
    textAlign: 'center',
    fontFamily: AppFonts.bodyMedium,
    fontSize: 13,
    color: palette.mutedGreen,
    marginTop: 8,
  },
});
