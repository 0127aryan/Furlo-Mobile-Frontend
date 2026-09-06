import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { followPet, getCommunities, getFollowingPets, getPackMembers, getPetProfile, sendWag } from '@/api/auth';
import { CreatePostForm } from '@/components/feed/CreatePostForm';
import { PostCard } from '@/components/feed/PostCard';
import { ReportPostModal } from '@/components/feed/ReportPostModal';
import { EditPetProfileModal } from '@/components/profile/EditPetProfileModal';
import { PackMembersModal } from '@/components/profile/PackMembersModal';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { startFollowRealtime } from '@/lib/subscribeFollowEvents';
import { applyFeedCounts, applyPostRowCounts, subscribeYardFeed } from '@/lib/subscribeYardFeed';
import { getPetSpecies, getPostVerb, getPostVerbPlural } from '@/lib/petVerbMap';
import { useAuthStore } from '@/store/useAuthStore';
import { usePetSocialStore } from '@/store/usePetSocialStore';
import type { Community, PackMember, Pet, PetProfileStats, Post } from '@/types/api';

type TabId = 'barks' | 'treats' | 'info';

type Props = {
  petId: string;
  showLogout?: boolean;
  onLogout?: () => void;
};

export function PetProfileView({ petId, showLogout, onLogout }: Props) {
  const activePet = useAuthStore((s) => s.activePet);
  const user = useAuthStore((s) => s.user);
  const lastFollowEvent = usePetSocialStore((s) => s.lastEvent);
  const setSocialCounts = usePetSocialStore((s) => s.setCounts);
  const applyFollow = usePetSocialStore((s) => s.applyFollow);
  const markWagged = usePetSocialStore((s) => s.markWagged);
  const waggedTargets = usePetSocialStore((s) => s.waggedTargets);
  const [pet, setPet] = useState<Pet | null>(null);
  const liveCounts = usePetSocialStore((s) => s.counts[pet?.id || ''] ?? s.counts[petId]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<PetProfileStats>({
    barksCount: 0,
    packMembersCount: 0,
    followingCount: 0,
    treatsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('barks');
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [listKind, setListKind] = useState<'pack' | 'following' | null>(null);
  const [listMembers, setListMembers] = useState<PackMember[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const isOwner = Boolean(
    (activePet?.id && pet?.id && activePet.id === pet.id) ||
      (user?.id && pet?.owner_id && user.id === pet.owner_id) ||
      (user?.id && pet?.users?.id && user.id === pet.users.id)
  );
  const petIdRef = useRef(activePet?.id);
  petIdRef.current = activePet?.id;

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await getPetProfile(petId, activePet?.id);
      setPet(data.pet);
      setPosts(data.posts || []);
      const barks = data.posts?.length || 0;
      const treats = (data.posts || []).reduce((sum, post) => sum + (post.like_count || 0), 0);
      const nextStats = {
        barksCount: data.stats?.barksCount ?? barks,
        packMembersCount: data.stats?.packMembersCount ?? 0,
        followingCount: data.stats?.followingCount ?? 0,
        treatsCount: data.stats?.treatsCount ?? treats,
        isFollowing: data.stats?.isFollowing,
      };
      setStats(nextStats);
      if (data.pet?.id) {
        setSocialCounts(data.pet.id, {
          packMembersCount: nextStats.packMembersCount,
          followingCount: nextStats.followingCount,
        });
      }
      if (data.stats?.isFollowing !== undefined) {
        setFollowing(Boolean(data.stats.isFollowing));
      }
    } catch {
      if (!silent) {
        setPet(null);
        setError('Failed to load pet profile');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [petId, activePet?.id, setSocialCounts]);

  useEffect(() => {
    startFollowRealtime();
    load();
  }, [load]);

  useEffect(() => {
    return subscribeYardFeed({
      onCounts: (payload) => {
        setPosts((prev) => applyFeedCounts(prev, payload, petIdRef.current));
      },
      onPostRow: (row) => {
        setPosts((prev) => applyPostRowCounts(prev, row));
      },
    });
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    getCommunities()
      .then(setCommunities)
      .catch(() => setCommunities([]));
  }, [isOwner]);

  useFocusEffect(
    useCallback(() => {
      startFollowRealtime();
      load(true);
    }, [load])
  );

  useEffect(() => {
    if (!pet?.id || !activePet?.id || isOwner) {
      setFollowing(false);
      return;
    }
    if (stats.isFollowing !== undefined) return;
    getPackMembers(pet.id)
      .then((data) => {
        setFollowing(data.members.some((member) => member.id === activePet.id));
      })
      .catch(() => {});
  }, [pet?.id, activePet?.id, isOwner, stats.isFollowing]);

  useEffect(() => {
    if (!lastFollowEvent || !pet?.id || !activePet?.id) return;
    if (lastFollowEvent.targetPetId === pet.id && lastFollowEvent.followerPetId === activePet.id) {
      setFollowing(lastFollowEvent.following);
    }
  }, [lastFollowEvent, pet?.id, activePet?.id]);

  async function handleFollow() {
    if (!pet?.id || actionBusy) return;
    if (!activePet?.id) {
      Alert.alert('Follow', 'Please log in with a pet profile to follow.');
      return;
    }

    const prevFollowing = following;
    const prevCount = liveCounts?.packMembersCount ?? stats.packMembersCount;
    setFollowing(!prevFollowing);
    setStats((prev) => ({
      ...prev,
      packMembersCount: prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1,
    }));
    setActionBusy(true);
    try {
      const data = await followPet(pet.id, activePet.id);
      setFollowing(data.following);
      applyFollow({
        targetPetId: data.targetPetId,
        followerPetId: data.followerPetId,
        following: data.following,
        packMembersCount: data.packMembersCount,
        followingCount: data.followingCount,
      });
      setStats((prev) => ({
        ...prev,
        packMembersCount:
          data.targetPetId === pet.id ? data.packMembersCount : prev.packMembersCount,
        followingCount:
          data.followerPetId === pet.id ? data.followingCount : prev.followingCount,
      }));
    } catch (err) {
      setFollowing(prevFollowing);
      setStats((prev) => ({ ...prev, packMembersCount: prevCount }));
      Alert.alert('Follow', err instanceof Error ? err.message : 'Could not update follow.');
    } finally {
      setActionBusy(false);
    }
  }

  async function openMemberList(kind: 'pack' | 'following') {
    if (!pet?.id) return;
    setListKind(kind);
    setListLoading(true);
    setListMembers([]);
    try {
      const data = kind === 'pack' ? await getPackMembers(pet.id) : await getFollowingPets(pet.id);
      setListMembers(data.members);
      if (kind === 'pack') {
        setStats((prev) => ({ ...prev, packMembersCount: data.count }));
        setSocialCounts(pet.id, { packMembersCount: data.count });
        if (activePet?.id && !isOwner) {
          setFollowing(data.members.some((member) => member.id === activePet.id));
        }
      } else {
        setStats((prev) => ({ ...prev, followingCount: data.count }));
        setSocialCounts(pet.id, { followingCount: data.count });
      }
    } catch {
      setListMembers([]);
    } finally {
      setListLoading(false);
    }
  }

  async function handleWag() {
    if (!pet?.id || waggedTargets[pet.id]) return;
    if (!activePet?.id) {
      Alert.alert('Wag', 'Please log in with a pet profile to send a wag.');
      return;
    }

    markWagged(pet.id);

    try {
      await sendWag(pet.id, activePet.id);
    } catch (err) {
      console.warn('[PetProfile] Send wag error:', err);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.amber} />
        <Text style={styles.loadingText}>Fetching pet profile...</Text>
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={styles.centered}>
        <Ionicons name="paw" size={40} color={palette.brown} />
        <Text style={styles.errorTitle}>{error || 'Pet not found'}</Text>
      </View>
    );
  }

  const avatar = pet.profile_image_url || '';
  const tags = pet.personality_tags || [];
  const packMembersCount = liveCounts?.packMembersCount ?? stats.packMembersCount;
  const followingCount = liveCounts?.followingCount ?? stats.followingCount;
  const wagSent = Boolean(waggedTargets[pet.id]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cover} />

        <View style={styles.identity}>
          <View style={styles.avatarRow}>
            <View>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarEmpty}>
                  <Ionicons name="paw" size={40} color={palette.amber} />
                </View>
              )}
              <View style={styles.verified}>
                <Ionicons name="checkmark" size={14} color="#163328" />
              </View>
            </View>

            {isOwner ? (
              <Pressable onPress={() => setEditOpen(true)} style={styles.editBtn}>
                <Ionicons name="create-outline" size={16} color="#011E14" />
                <Text style={styles.editLabel}>Edit Profile</Text>
              </Pressable>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  onPress={handleFollow}
                  style={[styles.followBtn, following && styles.followingBtn, { minHeight: TapTarget }]}>
                  <Ionicons
                    name={following ? 'checkmark' : 'person-add-outline'}
                    size={16}
                    color={following ? '#163328' : '#fff'}
                  />
                  <Text style={[styles.followLabel, following && styles.followingLabel]}>
                    {following ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleWag}
                  style={[styles.wagBtn, wagSent && styles.wagSent, { minHeight: TapTarget }]}>
                  <Ionicons name="hand-left-outline" size={16} color="#974900" />
                  <Text style={[styles.wagLabel, wagSent && { color: palette.amber }]}>
                    {wagSent ? 'Wag Sent! 🐾' : 'Send a Wag'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {isOwner ? (
            <View style={styles.postBtnRow}>
              <Pressable onPress={() => setCreateOpen(true)} style={styles.postBtn}>
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={styles.postLabel}>Post {getPostVerb(getPetSpecies(pet))}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.nameRow}>
            <Text style={styles.name}>{pet.name}</Text>
            <View style={styles.breedChip}>
              <Text style={styles.breedChipLabel}>{pet.breed || 'Companion'}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            {pet.username ? <Text style={styles.meta}>@{pet.username}</Text> : null}
            {pet.city ? (
              <Text style={styles.meta}>
                {pet.username ? ' • ' : ''}
                {pet.city}
              </Text>
            ) : null}
          </View>

          {pet.bio ? <Text style={styles.bio}>{pet.bio}</Text> : null}

          {tags.length > 0 ? (
            <View style={styles.tags}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagLabel}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.stats}>
            <Stat value={stats.barksCount} label={`${getPostVerbPlural(getPetSpecies(pet), 2)}`} />
            <View style={styles.statDivider} />
            <Stat
              value={packMembersCount}
              label="Pack Members"
              accent="#163328"
              onPress={() => openMemberList('pack')}
            />
            <View style={styles.statDivider} />
            <Stat
              value={followingCount}
              label="Following"
              onPress={() => openMemberList('following')}
            />
            <View style={styles.statDivider} />
            <Stat value={stats.treatsCount} label="Treats" accent={palette.amber} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {(['barks', 'treats', 'info'] as TabId[]).map((id) => (
              <Pressable key={id} onPress={() => setTab(id)} style={styles.tab}>
                <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>
                  {id === 'barks'
                    ? `${getPostVerbPlural(getPetSpecies(pet), 2)} (${posts.length})`
                    : id === 'treats'
                      ? 'Treats Received'
                      : 'Paw Print Info'}
                </Text>
                {tab === id ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            ))}
          </ScrollView>

          {tab === 'info' ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Companion Overview</Text>
              <View style={styles.infoGrid}>
                <InfoCell label="Breed" value={pet.breed || '—'} />
                <InfoCell label="City" value={pet.city || '—'} />
                <InfoCell label="Gender" value={pet.gender || 'Unknown'} />
                {pet.users?.name ? <InfoCell label="Pet Parent" value={pet.users.name} /> : null}
              </View>
            </View>
          ) : tab === 'treats' ? (
            <View style={styles.emptyCard}>
              <Ionicons name="paw" size={32} color={palette.amber} />
              <Text style={styles.emptyTitle}>
                {pet.name} has received {stats.treatsCount} treats!
              </Text>
              <Text style={styles.emptyBody}>
                Keep {getPostVerb(getPetSpecies(pet)).toLowerCase()}ing to collect more treats from the pack.
              </Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyBody}>
                {pet.name} has not posted any {getPostVerbPlural(getPetSpecies(pet), 2).toLowerCase()} yet 🐾
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReport={setReportingPostId}
                  onPatch={(id, patch) => {
                    setPosts((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
                  }}
                />
              ))}
            </View>
          )}

          {showLogout && onLogout ? (
            <Pressable onPress={onLogout} style={[styles.logout, { minHeight: TapTarget }]}>
              <Text style={styles.logoutLabel}>Log out</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <ReportPostModal
        postId={reportingPostId}
        visible={!!reportingPostId}
        onClose={() => setReportingPostId(null)}
      />

      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <SafeAreaView style={styles.createSafe}>
          <CreatePostForm
            communities={communities}
            onCancel={() => setCreateOpen(false)}
            onSuccess={(post) => {
              setPosts((prev) => [post, ...prev]);
              setStats((prev) => ({ ...prev, barksCount: prev.barksCount + 1 }));
              setCreateOpen(false);
            }}
          />
        </SafeAreaView>
      </Modal>

      <EditPetProfileModal
        visible={editOpen}
        pet={pet}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => setPet((prev) => (prev ? { ...prev, ...updated } : updated))}
      />

      <PackMembersModal
        visible={listKind !== null}
        title={
          listKind === 'following'
            ? `${pet.name}'s Following (${followingCount}) 🐾`
            : `${pet.name}'s Pack Members (${packMembersCount}) 🐾`
        }
        emptyText={
          listKind === 'following'
            ? `${pet.name} is not following any pets yet 🐾`
            : 'No pack members yet. Be the first to join the pack! 🐾'
        }
        loadingText={listKind === 'following' ? 'Loading following list...' : 'Loading pack members...'}
        loading={listLoading}
        members={listMembers}
        onClose={() => setListKind(null)}
      />
    </>
  );
}

function Stat({
  value,
  label,
  accent,
  onPress,
}: {
  value: number;
  label: string;
  accent?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.stat}>{content}</View>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontFamily: AppFonts.body, fontSize: 14, color: '#727974' },
  errorTitle: { fontFamily: AppFonts.heading, fontSize: 18, color: '#011E14', textAlign: 'center' },
  scroll: { paddingBottom: 40 },
  cover: {
    height: 168,
    backgroundColor: '#163328',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  identity: { paddingHorizontal: 16, marginTop: -48 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: '#FEF9F3',
    backgroundColor: '#fff',
  },
  avatarEmpty: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: '#FEF9F3',
    backgroundColor: palette.tabTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: {
    position: 'absolute',
    right: 4,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C9EAD9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#011E14',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  editLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#011E14' },
  postBtnRow: { alignItems: 'flex-end', marginBottom: 12 },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.amber,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: TapTarget,
  },
  postLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  createSafe: { flex: 1, backgroundColor: palette.cream },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8, flexShrink: 1 },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#163328',
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  followingBtn: { backgroundColor: '#C9EAD9' },
  followLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  followingLabel: { color: '#163328' },
  wagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#EDE8E1',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  wagSent: { borderColor: palette.amber, backgroundColor: 'rgba(232,132,58,0.1)' },
  wagLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#011E14' },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontFamily: AppFonts.heading, fontSize: 28, color: '#011E14' },
  breedChip: { backgroundColor: '#C9EAD9', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  breedChipLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#163328', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  meta: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: '#424844' },
  bio: { fontFamily: AppFonts.body, fontSize: 15, lineHeight: 22, color: '#1D1B18', marginBottom: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: '#FFDBC7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  tagLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.amber },
  stats: {
    backgroundColor: '#F8F3ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 12 },
  statPressed: { backgroundColor: '#f2eae0' },
  statValue: { fontFamily: AppFonts.heading, fontSize: 20, color: '#011E14' },
  statLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: '#727974',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: { width: 1, height: 28, backgroundColor: '#EDE8E1' },
  tabs: { gap: 20, paddingBottom: 4, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EDE8E1' },
  tab: { paddingBottom: 10 },
  tabLabel: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#727974' },
  tabLabelActive: { color: '#011E14' },
  tabUnderline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: palette.amber, borderTopLeftRadius: 99, borderTopRightRadius: 99 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EDE8E1', padding: 16, gap: 12 },
  infoTitle: { fontFamily: AppFonts.heading, fontSize: 16, color: '#011E14' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoCell: { width: '45%', gap: 2 },
  infoLabel: { fontFamily: AppFonts.body, fontSize: 12, color: '#727974' },
  infoValue: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#011E14', textTransform: 'capitalize' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: '#011E14', textAlign: 'center' },
  emptyBody: { fontFamily: AppFonts.body, fontSize: 14, color: '#727974', textAlign: 'center' },
  list: { gap: 16 },
  logout: {
    marginTop: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: palette.brown },
});
