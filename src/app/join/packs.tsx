import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { completeOnboarding, getCommunities, getMe } from '@/api/auth';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PackListSkeleton } from '@/components/skeletons';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { buildCompleteOnboardingBody } from '@/lib/onboarding';
import { roleFromPet } from '@/lib/role';
import { useAuthStore } from '@/store/useAuthStore';
import type { Community } from '@/types/api';

function formatMembers(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
}

export default function JoinPacksScreen() {
  const router = useRouter();
  const onboardingData = useAuthStore((s) => s.onboardingData);
  const setOnboardingData = useAuthStore((s) => s.setOnboardingData);
  const setUser = useAuthStore((s) => s.setUser);
  const setActivePet = useAuthStore((s) => s.setActivePet);

  const isLover = onboardingData?.role === 'lover';

  const [communities, setCommunities] = useState<Community[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCommunities()
      .then(setCommunities)
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  function toggleJoin(slug: string) {
    setJoined((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function finish(packs: string[]) {
    setCompleting(true);
    setError(null);
    try {
      await completeOnboarding(buildCompleteOnboardingBody(onboardingData, packs));
      try {
        const me = await getMe();
        setUser(me.user);
        setActivePet(me.activePet);
        useAuthStore.getState().setRole(onboardingData?.role || roleFromPet(me.activePet));
      } catch {
        // Session is still valid; feed gate uses store after getMe when possible.
      }
      setOnboardingData(null);
      setShowSuccess(true);
      await new Promise((r) => setTimeout(r, 1600));
      router.replace('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
      setCompleting(false);
    }
  }

  return (
    <OnboardingShell step={4} rightLabel="Finalizing…" onBack={() => router.back()}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <Text style={styles.stepTiny}>Step 4 of 4</Text>
            <Text style={styles.percent}>Finalizing...</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: '100%' }]} />
          </View>

          <Text style={styles.title}>{isLover ? 'Follow a few packs' : 'Find your pack'}</Text>
          <Text style={styles.subtitle}>
            {isLover
              ? 'Join communities to see adoption stories, advice, and pets near you.'
              : 'Join local communities and meet pets near you.'}
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <PackListSkeleton />
          ) : communities.length === 0 ? (
            <Text style={styles.empty}>No active communities found.</Text>
          ) : (
            <View style={styles.list}>
              {communities.map((pack) => {
                const slug = pack.slug || pack.id;
                const isJoined = joined.has(slug);
                return (
                  <View key={slug} style={[styles.packRow, isJoined && styles.packRowJoined]}>
                    <View
                      style={[
                        styles.packIcon,
                        { backgroundColor: isJoined ? '#c9ead9' : '#ffdbc7' },
                      ]}>
                      <Ionicons
                        name="people"
                        size={20}
                        color={isJoined ? palette.mutedGreen : palette.brown}
                      />
                    </View>
                    <View style={styles.packText}>
                      <Text style={[styles.packName, isJoined && { color: palette.mutedGreen }]}>
                        {pack.name}
                      </Text>
                      <Text style={styles.packMeta}>
                        {formatMembers(pack.member_count || 0)} Pack Members ·{' '}
                        {(pack.member_count || 0) > 10 ? 'Popular' : 'Active nearby'}
                      </Text>
                    </View>
                    <Pressable onPress={() => toggleJoin(slug)} style={styles.joinBtn}>
                      {isJoined ? (
                        <View style={styles.joined}>
                          <Ionicons name="checkmark" size={14} color={palette.mutedGreen} />
                          <Text style={styles.joinedLabel}>Joined</Text>
                        </View>
                      ) : (
                        <Text style={styles.joinLabel}>Join</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={() => finish(Array.from(joined))}
            disabled={completing}
            style={StyleSheet.flatten([
              styles.cta,
              { minHeight: TapTarget + 12, opacity: completing ? 0.7 : 1 },
            ])}>
            {completing ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.ctaLabel}>Setting up your pack…</Text>
              </>
            ) : (
              <>
                <Text style={styles.ctaLabel}>Complete Setup</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </Pressable>
          <Pressable disabled={completing} onPress={() => finish([])}>
            <Text style={styles.skip}>Maybe later, show me The Yard</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>
          By completing your setup, you agree to our Pack Guidelines and Privacy Policy.
          {isLover
            ? ' Your profile will be visible to members of the packs you join.'
            : ' Your Paw Print will be visible to members of the packs you join.'}
        </Text>
      </ScrollView>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Ionicons name="sparkles" size={40} color={palette.forest} />
          </View>
          <Text style={styles.successTitle}>Welcome to the Pack!</Text>
          <Text style={styles.successBody}>
            {isLover ? 'The Yard is ready for you. 🐾' : 'Your journey with Furlo begins now. 🐾'}
          </Text>
        </View>
      </Modal>

      {completing && !showSuccess ? (
        <View style={StyleSheet.absoluteFillObject}>
          <FurloLoadingScreen caption="Setting up your pack" />
        </View>
      ) : null}
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
  barTrack: { height: 6, borderRadius: 99, backgroundColor: '#ece7e2', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: palette.brown, borderRadius: 99 },
  title: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.forest, marginTop: 8 },
  subtitle: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, marginTop: -4 },
  errorBanner: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: { flex: 1, fontFamily: AppFonts.bodyMedium, fontSize: 13, color: '#991b1b' },
  loading: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  loadingText: { fontFamily: AppFonts.body, fontSize: 14, color: palette.faded },
  empty: { textAlign: 'center', paddingVertical: 32, fontFamily: AppFonts.body, color: palette.faded },
  list: { gap: 12 },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#fffbf7',
  },
  packRowJoined: { backgroundColor: '#e8f5ee', borderColor: '#c9ead9' },
  packIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packText: { flex: 1 },
  packName: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.ink },
  packMeta: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded, marginTop: 2 },
  joinBtn: { minHeight: TapTarget, justifyContent: 'center', paddingHorizontal: 8 },
  joinLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 13, color: palette.brown },
  joined: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  joinedLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 13, color: palette.mutedGreen },
  cta: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: palette.brown,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: { fontFamily: AppFonts.headingSemi, fontSize: 17, color: '#fff' },
  skip: {
    textAlign: 'center',
    fontFamily: AppFonts.bodyMedium,
    fontSize: 13,
    color: palette.faded,
    marginTop: 8,
  },
  legal: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: AppFonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: palette.faded,
    paddingHorizontal: 16,
  },
  success: {
    flex: 1,
    backgroundColor: 'rgba(254,249,243,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#c9ead9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontFamily: AppFonts.heading, fontSize: 32, color: palette.mutedGreen, textAlign: 'center' },
  successBody: { fontFamily: AppFonts.body, fontSize: 16, color: palette.muted, textAlign: 'center' },
});
