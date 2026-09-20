import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getAdminPets, getAdminUsers, updateAdminPetBadges, updateAdminPetStatus, updateAdminUserStatus } from '@/api/admin';
import { AdminPager } from '@/components/admin/AdminPager';
import { AdminSegmentedTabs } from '@/components/admin/AdminSegmentedTabs';
import { PetStatusBadges } from '@/components/profile/PetStatusBadges';
import { adminColors } from '@/constants/adminTheme';
import { PAGE_SIZE } from '@/lib/pagination';
import { AppFonts, TapTarget } from '@/constants/theme';
import { petHref } from '@/lib/petHref';
import type { AdminPetItem, AdminUserItem } from '@/types/admin';

type Directory = 'pets' | 'users';
type PetFilter = 'all' | 'verified' | 'founding';
type UserFilter = 'all' | 'active' | 'suspended' | 'admin' | 'deleted';

export default function AdminPetsScreen() {
  const router = useRouter();
  const [directory, setDirectory] = useState<Directory>('pets');

  const [pets, setPets] = useState<AdminPetItem[]>([]);
  const [petLoading, setPetLoading] = useState(true);
  const [petSearch, setPetSearch] = useState('');
  const [petFilter, setPetFilter] = useState<PetFilter>('all');

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [petPage, setPetPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [petTotal, setPetTotal] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setMenuUserId(null);
  }, [directory]);

  useEffect(() => {
    if (directory !== 'pets') return;
    const timer = setTimeout(() => {
      setPetLoading(true);
      getAdminPets(petSearch, petFilter, { page: petPage, limit: PAGE_SIZE })
        .then((res) => {
          setPets(res.pets ?? []);
          setPetTotal(res.totalCount);
          if ((res.pets ?? []).length === 0 && petPage > 1) setPetPage((p) => Math.max(1, p - 1));
        })
        .catch(() => Alert.alert('Pets', 'Failed to fetch pet directory'))
        .finally(() => setPetLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [directory, petSearch, petFilter, petPage]);

  useEffect(() => {
    if (directory !== 'users') return;
    const timer = setTimeout(() => {
      setUserLoading(true);
      getAdminUsers(userSearch, userFilter, { page: userPage, limit: PAGE_SIZE })
        .then((res) => {
          setUsers(res.users ?? []);
          setUserTotal(res.totalCount);
          if ((res.users ?? []).length === 0 && userPage > 1) setUserPage((p) => Math.max(1, p - 1));
        })
        .catch(() => Alert.alert('Users', 'Failed to fetch pet lovers directory'))
        .finally(() => setUserLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [directory, userSearch, userFilter, userPage]);

  function goPetPage(next: number) {
    setPetPage(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function goUserPage(next: number) {
    setUserPage(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function toggleBadge(pet: AdminPetItem, field: 'isVerified' | 'isFoundingPet') {
    const nextVerified = field === 'isVerified' ? !pet.is_verified : pet.is_verified;
    const nextFounding = field === 'isFoundingPet' ? !pet.is_founding_pet : pet.is_founding_pet;
    setPets((prev) =>
      prev.map((p) =>
        p.id === pet.id ? { ...p, is_verified: nextVerified, is_founding_pet: nextFounding } : p
      )
    );
    try {
      await updateAdminPetBadges(pet.id, nextVerified, nextFounding);
    } catch (err) {
      setPets((prev) =>
        prev.map((p) =>
          p.id === pet.id ? { ...p, is_verified: pet.is_verified, is_founding_pet: pet.is_founding_pet } : p
        )
      );
      Alert.alert('Pets', err instanceof Error ? err.message : 'Failed to update pet badges');
    }
  }

  async function togglePet(pet: AdminPetItem, nextStatus: 'active' | 'suspended' | 'deleted') {
    setPets((prev) => prev.map((p) => (p.id === pet.id ? { ...p, status: nextStatus } : p)));
    try {
      await updateAdminPetStatus(pet.id, nextStatus);
    } catch (err) {
      setPets((prev) => prev.map((p) => (p.id === pet.id ? pet : p)));
      Alert.alert('Pets', err instanceof Error ? err.message : 'Failed to update pet');
    }
  }

  async function toggleUser(user: AdminUserItem, nextStatus?: 'active' | 'suspended' | 'deleted') {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              ...(nextStatus ? { status: nextStatus } : {}),
            }
          : u
      )
    );
    try {
      await updateAdminUserStatus(user.id, { status: nextStatus });
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
      Alert.alert('Users', err instanceof Error ? err.message : 'Failed to update user');
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Pet Directory & Badges</Text>
      <Text style={styles.sub}>Search pets, issue badges, and manage pet lover accounts.</Text>

      <AdminSegmentedTabs
        value={directory}
        onChange={setDirectory}
        tabs={[
          { id: 'pets', label: 'Pets Directory' },
          { id: 'users', label: 'Pet Lovers' },
        ]}
      />

      {directory === 'pets' ? (
        <>
          <TextInput
            value={petSearch}
            onChangeText={(value) => {
              setPetSearch(value);
              setPetPage(1);
            }}
            placeholder="Search name, @username, or breed"
            placeholderTextColor={adminColors.muted}
            style={styles.search}
          />
          <AdminSegmentedTabs
            value={petFilter}
            onChange={(id) => {
              setPetFilter(id);
              setPetPage(1);
            }}
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'verified', label: 'Verified' },
              { id: 'founding', label: 'Founding' },
            ]}
          />
          {petLoading ? (
            <ActivityIndicator color={adminColors.accent} style={{ marginTop: 24 }} />
          ) : pets.length === 0 ? (
            <Text style={styles.empty}>No pets match this search.</Text>
          ) : (
            pets.map((pet) => (
              <View key={pet.id} style={styles.card}>
                <View style={styles.row}>
                  {pet.profile_image_url ? (
                    <Image source={{ uri: pet.profile_image_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarEmpty]}>
                      <Ionicons name="paw" size={16} color={adminColors.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{pet.name}</Text>
                    <Text style={styles.meta}>
                      @{pet.username} · {pet.breed || 'Companion'}
                    </Text>
                    <Text style={styles.meta}>{pet.owner?.email || '—'}</Text>
                    {pet.status === 'suspended' || pet.status === 'deleted' ? (
                      <Text style={[styles.meta, { color: pet.status === 'deleted' ? adminColors.muted : '#DC2626' }]}>
                        {pet.status === 'deleted' ? 'Deleted' : 'Suspended'}
                      </Text>
                    ) : null}
                    <PetStatusBadges isVerified={pet.is_verified} isFoundingPet={pet.is_founding_pet} />
                  </View>
                  <Pressable
                    onPress={() => setMenuUserId((id) => (id === pet.id ? null : pet.id))}
                    hitSlop={8}
                    style={styles.menuBtn}
                    accessibilityLabel="Pet actions">
                    <Ionicons name="ellipsis-vertical" size={18} color={adminColors.muted} />
                  </Pressable>
                </View>
                {menuUserId === pet.id ? (
                  <View style={styles.menu}>
                    <Pressable
                      onPress={() => {
                        setMenuUserId(null);
                        router.push(petHref(pet));
                      }}
                      style={styles.menuItem}>
                      <Ionicons name="open-outline" size={16} color={adminColors.evergreen} />
                      <Text style={styles.menuLabel}>View Profile</Text>
                    </Pressable>
                    {pet.status === 'deleted' ? (
                      <Pressable
                        onPress={() => {
                          setMenuUserId(null);
                          void togglePet(pet, 'active');
                        }}
                        style={styles.menuItem}>
                        <Ionicons name="refresh" size={16} color={adminColors.emeraldBadge} />
                        <Text style={[styles.menuLabel, { color: adminColors.emeraldBadge }]}>Restore</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setMenuUserId(null);
                          void togglePet(pet, pet.status === 'suspended' ? 'active' : 'suspended');
                        }}
                        style={styles.menuItem}>
                        <Ionicons name="ban-outline" size={16} color="#C2410C" />
                        <Text style={[styles.menuLabel, { color: '#C2410C' }]}>
                          {pet.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </Text>
                      </Pressable>
                    )}
                    {pet.status !== 'deleted' ? (
                      <Pressable
                        onPress={() => {
                          setMenuUserId(null);
                          Alert.alert(
                            'Delete pet',
                            `Delete ${pet.name}? This pet profile will be hidden from Furlo.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => void togglePet(pet, 'deleted'),
                              },
                            ]
                          );
                        }}
                        style={styles.menuItem}>
                        <Ionicons name="trash-outline" size={16} color={adminColors.redBadge} />
                        <Text style={[styles.menuLabel, { color: adminColors.redBadge }]}>Delete</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Verified Paw</Text>
                  <Switch
                    value={pet.is_verified}
                    onValueChange={() => toggleBadge(pet, 'isVerified')}
                    trackColor={{ true: adminColors.emeraldBadge, false: adminColors.line }}
                    thumbColor="#fff"
                  />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Founding Pet</Text>
                  <Switch
                    value={pet.is_founding_pet}
                    onValueChange={() => toggleBadge(pet, 'isFoundingPet')}
                    trackColor={{ true: adminColors.accent, false: adminColors.line }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            ))
          )}
          <AdminPager page={petPage} totalCount={petTotal} loading={petLoading} onPage={goPetPage} />
        </>
      ) : (
        <>
          <TextInput
            value={userSearch}
            onChangeText={(value) => {
              setUserSearch(value);
              setUserPage(1);
            }}
            placeholder="Search by email"
            placeholderTextColor={adminColors.muted}
            style={styles.search}
            autoCapitalize="none"
          />
          <AdminSegmentedTabs
            value={userFilter}
            onChange={(id) => {
              setUserFilter(id);
              setUserPage(1);
            }}
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'suspended', label: 'Suspended' },
              { id: 'admin', label: 'Admin' },
              { id: 'deleted', label: 'Deleted' },
            ]}
          />
          {userLoading ? (
            <ActivityIndicator color={adminColors.accent} style={{ marginTop: 24 }} />
          ) : users.length === 0 ? (
            <Text style={styles.empty}>No users match this search.</Text>
          ) : (
            users.map((user) => (
              <View key={user.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {user.email}
                    </Text>
                    <Text style={styles.meta}>
                      {user.status} {user.is_admin ? '· Admin' : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setMenuUserId((id) => (id === user.id ? null : user.id))}
                    hitSlop={8}
                    style={styles.menuBtn}
                    accessibilityLabel="Account actions">
                    <Ionicons name="ellipsis-vertical" size={18} color={adminColors.muted} />
                  </Pressable>
                </View>
                {menuUserId === user.id ? (
                  <View style={styles.menu}>
                    {user.status === 'deleted' ? (
                      <Pressable
                        onPress={() => {
                          setMenuUserId(null);
                          void toggleUser(user, 'active');
                        }}
                        style={styles.menuItem}>
                        <Ionicons name="refresh" size={16} color={adminColors.emeraldBadge} />
                        <Text style={[styles.menuLabel, { color: adminColors.emeraldBadge }]}>Restore</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setMenuUserId(null);
                          void toggleUser(user, user.status === 'suspended' ? 'active' : 'suspended');
                        }}
                        style={styles.menuItem}>
                        <Ionicons name="ban-outline" size={16} color="#C2410C" />
                        <Text style={[styles.menuLabel, { color: '#C2410C' }]}>
                          {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </Text>
                      </Pressable>
                    )}
                    {user.status !== 'deleted' ? (
                      <Pressable
                        onPress={() => {
                          setMenuUserId(null);
                          Alert.alert(
                            'Delete user',
                            `Delete ${user.email}? They will not be able to sign in.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => void toggleUser(user, 'deleted'),
                              },
                            ]
                          );
                        }}
                        style={styles.menuItem}>
                        <Ionicons name="trash-outline" size={16} color={adminColors.redBadge} />
                        <Text style={[styles.menuLabel, { color: adminColors.redBadge }]}>Delete</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ))
          )}
          <AdminPager page={userPage} totalCount={userTotal} loading={userLoading} onPage={goUserPage} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  h1: { fontFamily: AppFonts.heading, fontSize: 26, color: adminColors.evergreen },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted },
  search: {
    minHeight: TapTarget,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: adminColors.evergreen,
  },
  empty: { textAlign: 'center', color: adminColors.muted, fontFamily: AppFonts.body, marginTop: 24 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarEmpty: { backgroundColor: adminColors.cream, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: adminColors.evergreen },
  meta: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.evergreen },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  menuBtn: {
    width: TapTarget - 8,
    height: TapTarget - 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    backgroundColor: adminColors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: TapTarget - 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.evergreen },
});
