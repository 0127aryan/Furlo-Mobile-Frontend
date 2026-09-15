import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { followPet } from '@/api/auth';
import { SendWagButton } from '@/components/social/SendWagButton';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import type { CommunityMember } from '@/types/api';

type Props = {
  member: CommunityMember;
};

export function CommunityMemberRow({ member }: Props) {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);
  const isSelf = activePet?.id === member.id;
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFollow() {
    if (!activePet?.id || isSelf || busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await followPet(member.id, activePet.id);
      setFollowing(res.following);
    } catch {
      setFollowing(!next);
      Alert.alert('Follow', 'Could not update follow status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push(`/pet/${member.id}`)} style={styles.info}>
        {member.profile_image_url ? (
          <Image source={{ uri: member.profile_image_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty]}>
            <Ionicons name="paw" size={16} color={palette.amber} />
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.handle}>
            @{member.username || 'pet'} • {member.breed || 'Companion'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.amber} />
      </Pressable>

      {!isSelf ? (
        <View style={styles.actions}>
          <Pressable
            onPress={handleFollow}
            disabled={busy}
            style={[styles.followChip, following && styles.followingChip]}>
            <Ionicons
              name={following ? 'checkmark' : 'person-add-outline'}
              size={14}
              color={following ? palette.evergreenSoft : '#fff'}
            />
            <Text style={[styles.followChipText, following && styles.followingChipText]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
          <SendWagButton targetPetId={member.id} targetPetName={member.name} compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 10,
    gap: 10,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.tabTrack },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1 },
  name: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: palette.evergreen },
  handle: { fontFamily: AppFonts.body, fontSize: 12, color: palette.faded },
  actions: { flexDirection: 'row', gap: 8 },
  followChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.evergreen,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: TapTarget * 0.75,
  },
  followingChip: { backgroundColor: palette.sage },
  followChipText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
  followingChipText: { color: palette.evergreenSoft },
});
