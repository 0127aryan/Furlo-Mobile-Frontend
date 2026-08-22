import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getReceivedWags } from '@/api/auth';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { startFollowRealtime } from '@/lib/subscribeFollowEvents';
import { useAuthStore } from '@/store/useAuthStore';
import { usePetSocialStore } from '@/store/usePetSocialStore';
import type { WagItem } from '@/types/api';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);
  const wags = usePetSocialStore((s) => s.incomingWags);
  const setIncomingWags = usePetSocialStore((s) => s.setIncomingWags);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const next = await getReceivedWags(activePet?.id);
        setIncomingWags(next);
      } catch {
        if (!silent) setIncomingWags([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [activePet?.id, setIncomingWags]
  );

  useFocusEffect(
    useCallback(() => {
      startFollowRealtime();
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  function openSender(wag: WagItem) {
    router.push(`/pet/${wag.sender.id}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Tail wags from the pack</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.amber} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.amber} />}>
          {wags.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="paw" size={36} color={palette.amber} />
              <Text style={styles.emptyTitle}>No wags yet</Text>
              <Text style={styles.emptyBody}>When another pet sends you a wag, it will show up here.</Text>
            </View>
          ) : (
            wags.map((wag) => (
              <Pressable
                key={wag.id}
                onPress={() => openSender(wag)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed, { minHeight: TapTarget }]}>
                {wag.sender.profile_image_url ? (
                  <Image source={{ uri: wag.sender.profile_image_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarEmpty}>
                    <Ionicons name="paw" size={18} color={palette.amber} />
                  </View>
                )}
                <View style={styles.meta}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {wag.sender.name} sent you a tail wag
                  </Text>
                  <Text style={styles.cardBody} numberOfLines={1}>
                    {wag.message || 'Wagged at your profile! 🐾'}
                  </Text>
                  <Text style={styles.time}>{timeAgo(wag.created_at)}</Text>
                </View>
                <Ionicons name="hand-left-outline" size={18} color="#974900" />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF9F3' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontFamily: AppFonts.heading, fontSize: 28, color: '#011E14' },
  subtitle: { fontFamily: AppFonts.body, fontSize: 14, color: '#727974', marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  empty: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: '#011E14' },
  emptyBody: { fontFamily: AppFonts.body, fontSize: 14, color: '#727974', textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 12,
  },
  cardPressed: { backgroundColor: '#f6f9ff' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#EDE8E1', backgroundColor: '#f8f3ed' },
  avatarEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f3ed',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#011E14' },
  cardBody: { fontFamily: AppFonts.body, fontSize: 13, color: '#727974', marginTop: 2 },
  time: { fontFamily: AppFonts.body, fontSize: 11, color: '#887366', marginTop: 4 },
});
