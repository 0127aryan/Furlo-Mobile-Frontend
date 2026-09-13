import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityDisclaimerFooter } from '@/components/common/CommunityDisclaimerFooter';
import { AppFonts, palette, TapTarget } from '@/constants/theme';

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

  function openPage(href: (typeof LINKS)[number]['href']) {
    onClose();
    router.push(href);
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
            {LINKS.map((link) => (
              <Pressable
                key={link.href}
                onPress={() => openPage(link.href)}
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={palette.faded} />
              </Pressable>
            ))}
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
  linkLabel: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: palette.evergreenSoft },
  copyright: { fontFamily: AppFonts.bodyMedium, fontSize: 11, color: '#727974' },
});
