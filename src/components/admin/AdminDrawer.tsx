import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminCountBadge } from '@/components/admin/AdminCountBadge';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import { useAdminStore } from '@/store/useAdminStore';
import { useAuthStore } from '@/store/useAuthStore';

type NavItem = {
  id: string;
  href: '/admin' | '/admin/communities' | '/admin/pets' | '/admin/moderation' | '/admin/banners' | '/admin/broadcast';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  exact?: boolean;
  badgeKey?: 'pendingApprovals' | 'openReports';
  badgeColor?: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', href: '/admin', label: 'Overview & Metrics', icon: 'grid-outline', exact: true },
  {
    id: 'approvals',
    href: '/admin/communities',
    label: 'Community Approvals',
    icon: 'people-outline',
    badgeKey: 'pendingApprovals',
  },
  { id: 'pets', href: '/admin/pets', label: 'Pet Directory & Badges', icon: 'paw-outline' },
  {
    id: 'moderation',
    href: '/admin/moderation',
    label: 'Moderation Queue',
    icon: 'shield-outline',
    badgeKey: 'openReports',
    badgeColor: adminColors.redBadge,
  },
  { id: 'banners', href: '/admin/banners', label: 'Announcement Banners', icon: 'megaphone-outline' },
  { id: 'broadcast', href: '/admin/broadcast', label: 'Platform Broadcast', icon: 'send-outline' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AdminDrawer({ visible, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const pendingApprovals = useAdminStore((s) => s.pendingApprovals);
  const openReports = useAdminStore((s) => s.openReports);

  function open(href: NavItem['href']) {
    onClose();
    router.push(href);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>Furlo Ops</Text>
              <Text style={styles.brandSub}>Super Admin</Text>
            </View>
            <Pressable
              onPress={() => {
                onClose();
                router.replace('/(tabs)/feed');
              }}
              hitSlop={8}
              style={styles.exitBtn}>
              <Ionicons name="open-outline" size={16} color={adminColors.sidebarMuted} />
            </Pressable>
          </View>

          <Text style={styles.navLabel}>Operations Navigation</Text>
          <ScrollView contentContainerStyle={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const badge =
                item.badgeKey === 'pendingApprovals'
                  ? pendingApprovals
                  : item.badgeKey === 'openReports'
                    ? openReports
                    : 0;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => open(item.href)}
                  style={[styles.navItem, isActive && styles.navItemActive]}>
                  <View style={styles.navLeft}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isActive ? adminColors.accent : adminColors.sidebarDim}
                    />
                    <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
                  </View>
                  <AdminCountBadge
                    count={badge}
                    color={item.badgeColor || adminColors.accent}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.footerName} numberOfLines={1}>
                {user?.name || 'Super Admin'}
              </Text>
              <Text style={styles.footerEmail} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(1, 30, 20, 0.45)' },
  panel: {
    flex: 1,
    width: '86%',
    maxWidth: 320,
    backgroundColor: adminColors.evergreen,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.evergreenSoft,
    marginBottom: 16,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: adminColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontFamily: AppFonts.heading, fontSize: 18, color: '#fff' },
  brandSub: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.sidebarDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  exitBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: adminColors.evergreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.sidebarDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  nav: { gap: 6, paddingBottom: 16 },
  navItem: {
    minHeight: TapTarget,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItemActive: { backgroundColor: adminColors.sidebarActive },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  navText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: adminColors.sidebarMuted, flex: 1 },
  navTextActive: { color: '#fff' },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: adminColors.evergreenSoft,
    backgroundColor: adminColors.sidebarFooter,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.sidebarActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
  footerName: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
  footerEmail: { fontFamily: AppFonts.body, fontSize: 10, color: adminColors.sidebarMuted, marginTop: 2 },
});
