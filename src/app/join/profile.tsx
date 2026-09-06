import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import { checkUsername } from '@/api/auth';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { BREEDS_BY_PET_TYPE, PET_TYPE_OPTIONS } from '@/constants/petData';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { compressImage } from '@/lib/compressImage';
import { useAuthStore } from '@/store/useAuthStore';

const SPECIES_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  dogs: 'dog',
  cats: 'cat',
  birds: 'bird',
  rabbits: 'rabbit',
  hamsters: 'rodent',
  other: 'shape',
};

export default function JoinProfileScreen() {
  const router = useRouter();
  const onboardingData = useAuthStore((s) => s.onboardingData);
  const setOnboardingData = useAuthStore((s) => s.setOnboardingData);
  const role = onboardingData?.role || 'parent';

  const [petName, setPetName] = useState(onboardingData?.petName || '');
  const [petUsername, setPetUsername] = useState(onboardingData?.petUsername || '');
  const [petType, setPetType] = useState(onboardingData?.petType || '');
  const [customPetType, setCustomPetType] = useState(onboardingData?.customPetType || '');
  const [breed, setBreed] = useState(onboardingData?.breed || '');
  const [customBreed, setCustomBreed] = useState(onboardingData?.customBreed || '');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>(onboardingData?.gender || 'unknown');
  const [city, setCity] = useState(onboardingData?.city || '');
  const [displayName, setDisplayName] = useState(onboardingData?.petName || '');
  const [loverUsername, setLoverUsername] = useState(onboardingData?.petUsername || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(onboardingData?.avatarData || null);

  const [breedOpen, setBreedOpen] = useState(false);
  const [breedQuery, setBreedQuery] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const handleUsername = role === 'parent' ? petUsername : loverUsername;

  const availableBreeds = petType ? BREEDS_BY_PET_TYPE[petType] || [] : [];
  const filteredBreeds = useMemo(
    () => availableBreeds.filter((b) => b.toLowerCase().includes(breedQuery.toLowerCase())),
    [availableBreeds, breedQuery]
  );

  useEffect(() => {
    if (!handleUsername || handleUsername.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }
    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsername(handleUsername);
        setUsernameAvailable(res.available);
        setUsernameError(res.available ? null : 'This username is already taken.');
      } catch (err) {
        setUsernameError(err instanceof Error ? err.message : 'Error checking username.');
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [handleUsername]);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    try {
      const dataUrl = await compressImage(result.assets[0].uri, 400, 0.8);
      setAvatarPreview(dataUrl);
    } catch {
      Alert.alert('Photo', 'Could not process that image. Try another one.');
    }
  }

  function persistProfile() {
    if (role === 'parent') {
      const resolvedPetType = petType === 'other' ? customPetType || 'Other' : petType;
      const resolvedBreed = breed === 'Other' ? customBreed || 'Other' : breed || 'Unknown';
      setOnboardingData({
        petName,
        petUsername: petUsername.trim() || undefined,
        petType: resolvedPetType,
        customPetType: petType === 'other' ? customPetType : undefined,
        breed: resolvedBreed,
        customBreed: breed === 'Other' ? customBreed : undefined,
        gender,
        city,
        avatarData: avatarPreview || undefined,
      });
    } else {
      setOnboardingData({
        petName: displayName,
        petUsername: loverUsername.trim() || undefined,
        city,
        avatarData: avatarPreview || undefined,
      });
    }
  }

  function canContinue() {
    if (checkingUsername || usernameAvailable === false) return false;
    if (handleUsername.length > 0 && handleUsername.length < 3) return false;
    if (role === 'parent') {
      if (!petName.trim() || !city.trim() || !petType) return false;
      if (petType === 'other' && !customPetType.trim()) return false;
      if (breed === 'Other' && !customBreed.trim()) return false;
      return true;
    }
    return Boolean(displayName.trim() && city.trim());
  }

  function handleContinue() {
    if (!canContinue()) return;
    persistProfile();
    router.push('/join/bio');
  }

  function sanitizeHandle(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  const breedDisplay =
    breed === 'Other' ? (customBreed ? `Other: ${customBreed}` : 'Other') : breed;

  return (
    <OnboardingShell
      step={2}
      rightLabel="Save Progress"
      onBack={() => router.back()}
      onRightPress={persistProfile}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.stepRow}>
              <Text style={styles.stepTiny}>Step 2 of 4</Text>
              <View style={styles.miniTrack}>
                <View style={[styles.miniFill, { width: '50%' }]} />
              </View>
            </View>
            <Text style={styles.title}>
              {role === 'parent' ? "Set up your pet's Paw Print" : 'Build your Paw Print'}
            </Text>
            <Text style={styles.subtitle}>
              {role === 'parent' ? 'This is how the pack will know them.' : 'Tell the pack a bit about yourself.'}
            </Text>

            <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarEmpty}>
                  <Ionicons name="camera-outline" size={28} color={palette.border} />
                  <Text style={styles.avatarHint}>Add photo</Text>
                </View>
              )}
              <View style={styles.plus}>
                <Ionicons name="add" size={18} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.optional}>Upload a photo (optional)</Text>

            {role === 'parent' ? (
              <>
                <Text style={styles.label}>Pet's Name</Text>
                <TextInput
                  value={petName}
                  onChangeText={setPetName}
                  placeholder="What do you call them?"
                  placeholderTextColor={palette.border}
                  style={styles.input}
                />

                <View style={styles.labelRow}>
                  <Text style={styles.label}>Pet Username</Text>
                  <Text style={styles.optionalInline}>(optional)</Text>
                </View>
                <View>
                  <Text style={styles.at}>@</Text>
                  <TextInput
                    value={petUsername}
                    onChangeText={(v) => setPetUsername(sanitizeHandle(v))}
                    placeholder="bruno_the_lab"
                    placeholderTextColor={palette.border}
                    autoCapitalize="none"
                    style={[styles.input, styles.handleInput]}
                  />
                </View>
                <UsernameStatus
                  value={petUsername}
                  checking={checkingUsername}
                  error={usernameError}
                  available={usernameAvailable}
                />

                <Text style={styles.speciesLabel}>SPECIES</Text>
                <View style={styles.pills}>
                  {PET_TYPE_OPTIONS.map((opt) => {
                    const selected = petType === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => {
                          setPetType(opt.id);
                          setBreed('');
                          setCustomBreed('');
                        }}
                        style={[styles.pill, selected && styles.pillSelected]}>
                        <MaterialCommunityIcons
                          name={SPECIES_ICONS[opt.id] || 'shape'}
                          size={16}
                          color={selected ? '#fff' : palette.charcoal}
                        />
                        <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {petType === 'other' ? (
                  <TextInput
                    value={customPetType}
                    onChangeText={setCustomPetType}
                    placeholder="Type species name (e.g. Turtle, Guinea Pig)..."
                    placeholderTextColor={palette.border}
                    style={[styles.input, styles.amberBorder]}
                  />
                ) : null}

                <Text style={styles.label}>Breed</Text>
                <Pressable
                  onPress={() => petType && setBreedOpen(true)}
                  style={[styles.input, !petType && styles.inputDisabled]}>
                  <Text style={{ color: breedDisplay ? palette.ink : palette.faded, fontFamily: AppFonts.body }}>
                    {!petType ? 'Select pet type first...' : breedDisplay || 'Select breed...'}
                  </Text>
                  <Ionicons
                    name="search"
                    size={18}
                    color={palette.faded}
                    style={styles.inputIcon}
                  />
                </Pressable>
                {breed === 'Other' ? (
                  <>
                    <TextInput
                      value={customBreed}
                      onChangeText={setCustomBreed}
                      placeholder="Type custom breed name..."
                      placeholderTextColor={palette.border}
                      style={[styles.input, styles.amberBorder]}
                    />
                    <Text style={styles.tiny}>
                      Custom breed will be saved & submitted for admin catalog approval.
                    </Text>
                  </>
                ) : null}

                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderTrack}>
                  {(
                    [
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'unknown', label: 'Other' },
                    ] as const
                  ).map((g) => (
                    <Pressable
                      key={g.value}
                      onPress={() => setGender(g.value)}
                      style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]}>
                      <Text style={[styles.genderLabel, gender === g.value && styles.genderLabelActive]}>
                        {g.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>City</Text>
                <View>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Your city"
                    placeholderTextColor={palette.border}
                    style={[styles.input, { paddingRight: 40 }]}
                  />
                  <Ionicons name="location" size={18} color={palette.faded} style={styles.inputIcon} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Alex Smith"
                  placeholderTextColor={palette.border}
                  style={styles.input}
                />
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Username</Text>
                  <Text style={styles.optionalInline}>(optional)</Text>
                </View>
                <View>
                  <Text style={styles.at}>@</Text>
                  <TextInput
                    value={loverUsername}
                    onChangeText={(v) => setLoverUsername(sanitizeHandle(v))}
                    placeholder="alex_loves_dogs"
                    placeholderTextColor={palette.border}
                    autoCapitalize="none"
                    style={[styles.input, styles.handleInput]}
                  />
                </View>
                <UsernameStatus
                  value={loverUsername}
                  checking={checkingUsername}
                  error={usernameError}
                  available={usernameAvailable}
                />
                <Text style={styles.label}>City</Text>
                <View>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Your city"
                    placeholderTextColor={palette.border}
                    style={[styles.input, { paddingRight: 40 }]}
                  />
                  <Ionicons name="location" size={18} color={palette.faded} style={styles.inputIcon} />
                </View>
              </>
            )}

            <Pressable
              onPress={handleContinue}
              disabled={!canContinue()}
              style={StyleSheet.flatten([
                styles.cta,
                { minHeight: TapTarget + 12, opacity: canContinue() ? 1 : 0.5 },
              ])}>
              <Text style={styles.ctaLabel}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={breedOpen} animationType="slide" transparent>
        <Pressable style={styles.modalScrim} onPress={() => setBreedOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select breed</Text>
            <TextInput
              value={breedQuery}
              onChangeText={setBreedQuery}
              placeholder="Search..."
              placeholderTextColor={palette.border}
              autoFocus
              style={styles.input}
            />
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {filteredBreeds.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setBreed(item);
                    if (item !== 'Other') setCustomBreed('');
                    setBreedOpen(false);
                    setBreedQuery('');
                  }}
                  style={styles.modalRow}>
                  <Text style={[styles.modalRowText, breed === item && { color: palette.brown, fontFamily: AppFonts.bodySemi }]}>
                    {item}
                  </Text>
                  {breed === item ? <Ionicons name="checkmark" size={16} color={palette.brown} /> : null}
                </Pressable>
              ))}
              {!filteredBreeds.includes('Other') ? (
                <Pressable
                  onPress={() => {
                    setBreed('Other');
                    setBreedOpen(false);
                    setBreedQuery('');
                  }}
                  style={styles.modalRow}>
                  <Text style={[styles.modalRowText, { color: palette.brown, fontFamily: AppFonts.bodySemi }]}>
                    + Other (Enter custom breed)
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </OnboardingShell>
  );
}

function UsernameStatus({
  value,
  checking,
  error,
  available,
}: {
  value: string;
  checking: boolean;
  error: string | null;
  available: boolean | null;
}) {
  if (!value) return null;
  if (value.length < 3) {
    return <Text style={styles.statusMuted}>Username must be at least 3 characters if provided.</Text>;
  }
  if (checking) {
    return (
      <View style={styles.statusRow}>
        <ActivityIndicator size="small" color={palette.faded} />
        <Text style={styles.statusMuted}>Checking availability...</Text>
      </View>
    );
  }
  if (error) {
    return <Text style={styles.statusError}>{error}</Text>;
  }
  if (available) {
    return <Text style={styles.statusOk}>furlo.in/@{value} is available!</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 24,
    backgroundColor: '#fffbf7',
    borderWidth: 1,
    borderColor: '#ede8e1',
    padding: 24,
    gap: 10,
  },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepTiny: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
  },
  miniTrack: { width: 112, height: 6, borderRadius: 99, backgroundColor: '#f2ede7', overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: palette.amber },
  title: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.forest },
  subtitle: { fontFamily: AppFonts.body, fontSize: 15, color: palette.muted, marginTop: -4, marginBottom: 8 },
  avatarWrap: { alignSelf: 'center', marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: palette.amber },
  avatarEmpty: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.border,
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.border,
    marginTop: 4,
  },
  plus: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optional: { textAlign: 'center', fontFamily: AppFonts.body, fontSize: 12, color: palette.faded, marginBottom: 8 },
  label: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.mutedGreen,
    marginTop: 6,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  optionalInline: { fontFamily: AppFonts.bodyMedium, fontSize: 11, color: palette.faded },
  input: {
    borderWidth: 1,
    borderColor: '#ede8e1',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: AppFonts.body,
    fontSize: 15,
    color: palette.ink,
  },
  inputDisabled: { backgroundColor: '#f7f4f0' },
  handleInput: { paddingLeft: 28 },
  at: { position: 'absolute', left: 14, top: 16, zIndex: 1, color: palette.faded, fontFamily: AppFonts.bodyMedium },
  inputIcon: { position: 'absolute', right: 12, top: 16 },
  amberBorder: { borderColor: palette.amber },
  speciesLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    color: palette.charcoal,
    marginTop: 8,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    backgroundColor: '#FFFBF7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillSelected: { backgroundColor: palette.amber, borderWidth: 0 },
  pillLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: palette.charcoal },
  pillLabelSelected: { color: '#fff' },
  genderTrack: {
    flexDirection: 'row',
    backgroundColor: '#f2ede7',
    borderRadius: 12,
    padding: 4,
    height: 50,
  },
  genderBtn: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  genderBtnActive: { backgroundColor: '#fff' },
  genderLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 13, color: palette.muted },
  genderLabelActive: { fontFamily: AppFonts.bodySemi, color: palette.brown },
  tiny: { fontFamily: AppFonts.body, fontSize: 10, color: palette.faded, marginTop: -4 },
  cta: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: palette.amber,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: { fontFamily: AppFonts.headingSemi, fontSize: 16, color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusMuted: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded },
  statusError: { fontFamily: AppFonts.bodyMedium, fontSize: 12, color: '#ba1a1a' },
  statusOk: { fontFamily: AppFonts.bodyMedium, fontSize: 12, color: palette.mutedGreen },
  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
    gap: 12,
  },
  modalTitle: { fontFamily: AppFonts.headingSemi, fontSize: 18, color: palette.ink },
  modalList: { maxHeight: 360 },
  modalRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowText: { fontFamily: AppFonts.body, fontSize: 14, color: palette.ink },
});
