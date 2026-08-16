import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

type JoinType = 'parent' | 'lover';

const OPTIONS: {
  id: JoinType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    id: 'parent',
    icon: 'paw',
    title: "I'm a Pet Parent",
    description: 'Create unique Paw Prints for your companions and connect with local breed packs.',
  },
  {
    id: 'lover',
    icon: 'heart',
    title: 'I Love Pets',
    description: 'Explore The Yard, browse adoption stories, and follow your favorite Pack Members.',
  },
];

export default function JoinSelectScreen() {
  const router = useRouter();
  const onboardingData = useAuthStore((s) => s.onboardingData);
  const setOnboardingData = useAuthStore((s) => s.setOnboardingData);
  const [selected, setSelected] = useState<JoinType | null>(onboardingData?.role ?? null);
  const [animating, setAnimating] = useState(false);

  async function handleContinue() {
    if (!selected || animating) return;
    setAnimating(true);
    setOnboardingData({ role: selected });
    await new Promise((r) => setTimeout(r, 300));
    router.push('/join/profile');
  }

  return (
    <OnboardingShell step={1} onBack={() => router.replace('/join')}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How would you like to join Furlo?</Text>
        <Text style={styles.subtitle}>You can always change this later.</Text>

        <View style={styles.cards}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setSelected(opt.id)}
                style={[styles.card, isSelected && styles.cardSelected]}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: opt.id === 'parent' ? 'rgba(151,73,0,0.10)' : 'rgba(71,101,88,0.20)' },
                  ]}>
                  <Ionicons
                    name={opt.icon}
                    size={26}
                    color={opt.id === 'parent' ? palette.brown : palette.mutedGreen}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, isSelected && { color: palette.brown }]}>{opt.title}</Text>
                  <Text style={styles.cardBody}>{opt.description}</Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={palette.brown} style={styles.check} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={!selected || animating}
          style={StyleSheet.flatten([
            styles.cta,
            { minHeight: TapTarget + 12, backgroundColor: selected ? palette.brown : '#f2ede7' },
          ])}>
          {animating ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={[styles.ctaLabel, { color: '#fff' }]}>Setting up your profile…</Text>
            </>
          ) : (
            <>
              <Text style={[styles.ctaLabel, { color: selected ? '#fff' : palette.faded }]}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={selected ? '#fff' : palette.faded} />
            </>
          )}
        </Pressable>

        <Text style={styles.memberHint}>
          Already in the pack?{' '}
          <Text style={styles.link} onPress={() => router.replace('/join')}>
            Find Your Pack
          </Text>
        </Text>
      </ScrollView>
      {animating ? (
        <View style={StyleSheet.absoluteFillObject}>
          <FurloLoadingScreen caption="Setting up your profile" />
        </View>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 32 },
  title: { fontFamily: AppFonts.heading, fontSize: 30, lineHeight: 36, color: palette.ink },
  subtitle: { fontFamily: AppFonts.body, fontSize: 15, color: palette.muted, marginTop: 8, marginBottom: 24 },
  cards: { gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.cream,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: palette.brown,
    backgroundColor: '#fff8f3',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, paddingRight: 24, gap: 6 },
  cardTitle: { fontFamily: AppFonts.headingSemi, fontSize: 18, color: palette.ink },
  cardBody: { fontFamily: AppFonts.body, fontSize: 13, lineHeight: 20, color: palette.muted },
  check: { position: 'absolute', top: 16, right: 16 },
  cta: {
    marginTop: 24,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: { fontFamily: AppFonts.headingSemi, fontSize: 16 },
  memberHint: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: AppFonts.body,
    fontSize: 13,
    color: palette.faded,
  },
  link: { fontFamily: AppFonts.bodySemi, color: palette.brown },
});
