import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logout } from '@/api/auth';
import { CommunityDisclaimerFooter } from '@/components/common/CommunityDisclaimerFooter';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { isAdminUser } from '@/lib/isAdminUser';
import { useAuthStore } from '@/store/useAuthStore';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const LINKS = [
  { label: 'About', href: '/about' as const },
  { label: 'Privacy', href: '/privacy' as const },
  { label: 'Terms', href: '/terms' as const },
];

export function ProfileMenuSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const showOps = isAdminUser(user);
  const [loggingOut, setLoggingOut] = useState(false);

  function openPage(href: (typeof LINKS)[number]['href']) {
    onClose();
    router.push(href);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    onClose();
    try {
      await logout();
    } finally {
      router.replace('/join');
    }
  }

  if (loggingOut) {
    return <FurloLoadingScreen caption="Signing you out" />;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Menu</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={palette.faded} />
            </Pressable>
          </View>

          <View style={styles.links}>
            {showOps ? (
              <Pressable
                onPress={() => {
                  onClose();
                  router.push('/admin');
                }}
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
                <View style={styles.opsRow}>
                  <Ionicons name="shield-checkmark" size={18} color={palette.amber} />
                  <Text style={styles.linkLabel}>Furlo Ops</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.faded} />
              </Pressable>
            ) : null}
            {LINKS.map((link) => (
              <Pressable
                key={link.href}
                onPress={() => openPage(link.href)}
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={palette.faded} />
              </Pressable>
            ))}
            {user ? (
              <Pressable
                onPress={() => void handleLogout()}
                style={({ pressed }) => [styles.linkRow, pressed && styles.logoutRowPressed]}>
                <View style={styles.opsRow}>
                  <Ionicons name="log-out-outline" size={18} color="#BA1A1A" />
                  <Text style={styles.logoutLabel}>Log Out</Text>
                </View>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.footer}>
            <CommunityDisclaimerFooter compact />
            <Text style={styles.copyright}>© 2026 Furlo Inc.</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(1, 30, 20, 0.35)', alignItems: 'flex-end' },
  panel: {
    flex: 1,
    width: '82%',
    maxWidth: 320,
    backgroundColor: palette.cream,
    borderLeftWidth: 1,
    borderLeftColor: palette.cardLine,
    paddingHorizontal: 20,
  },
  footer: { marginTop: 'auto', gap: 14, paddingTop: 16 },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  panelTitle: { fontFamily: AppFonts.heading, fontSize: 22, color: palette.evergreen },
  closeBtn: { padding: 4 },
  links: { gap: 4 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TapTarget,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  linkRowPressed: { backgroundColor: '#F8F3ED' },
  opsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkLabel: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: palette.evergreenSoft },
  logoutLabel: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: '#BA1A1A' },
  logoutRowPressed: { backgroundColor: '#FFF5F5' },
  copyright: { fontFamily: AppFonts.bodyMedium, fontSize: 11, color: '#727974' },
});
