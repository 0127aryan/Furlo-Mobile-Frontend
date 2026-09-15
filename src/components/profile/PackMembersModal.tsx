import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ListRowsSkeleton } from '@/components/skeletons';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import type { PackMember } from '@/types/api';

type Props = {
  visible: boolean;
  title: string;
  emptyText: string;
  loadingText?: string;
  loading: boolean;
  members: PackMember[];
  onClose: () => void;
};

export function PackMembersModal({
  visible,
  title,
  emptyText,
  loadingText = 'Loading pack members...',
  loading,
  members,
  onClose,
}: Props) {
  const router = useRouter();

  function openPet(member: PackMember) {
    onClose();
    router.push(`/pet/${member.id}`);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color="#727974" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {loading ? (
              <ListRowsSkeleton count={5} />
            ) : members.length === 0 ? (
              <View style={styles.status}>
                <Text style={styles.statusText}>{emptyText}</Text>
              </View>
            ) : (
              members.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => openPet(member)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                  {member.profile_image_url ? (
                    <Image source={{ uri: member.profile_image_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarEmpty}>
                      <Ionicons name="paw" size={18} color={palette.amber} />
                    </View>
                  )}
                  <View style={styles.meta}>
                    <Text style={styles.name} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={styles.handle} numberOfLines={1}>
                      @{member.username || 'pet'}
                      {member.breed ? ` • ${member.breed}` : ''}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#FEF9F3',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E1',
  },
  title: { flex: 1, fontFamily: AppFonts.heading, fontSize: 18, color: '#011E14' },
  close: {
    width: TapTarget,
    height: TapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  list: { padding: 20, gap: 12 },
  status: { paddingVertical: 32, alignItems: 'center', gap: 10 },
  statusText: { fontFamily: AppFonts.body, fontSize: 14, color: '#727974', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  rowPressed: { backgroundColor: '#f6f9ff' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EDE8E1', backgroundColor: '#f8f3ed' },
  avatarEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f3ed',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, minWidth: 0 },
  name: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#011E14' },
  handle: { fontFamily: AppFonts.body, fontSize: 12, color: '#727974', marginTop: 2 },
});
