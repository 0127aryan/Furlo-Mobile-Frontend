import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts, palette, TapTarget } from '@/constants/theme';

type Props = {
  visible: boolean;
  onEnable: () => void;
  onLater: () => void;
};

export function PushPermissionSheet({ visible, onEnable, onLater }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onLater}>
      <Pressable style={styles.backdrop} onPress={onLater}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Ionicons name="notifications" size={36} color={palette.amber} />
            <View style={styles.bellBadge}>
              <Ionicons name="paw" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>Stay in the Pack Loop 🐾</Text>
          <Text style={styles.body}>
            Get instant alerts when your pup receives treats, best answers on Q&A advice, or pack event
            updates nearby.
          </Text>
          <Pressable
            onPress={onEnable}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
            <Text style={styles.primaryLabel}>Enable Push Notifications</Text>
          </Pressable>
          <Pressable onPress={onLater} hitSlop={8} style={styles.secondaryBtn}>
            <Text style={styles.secondaryLabel}>Maybe Later</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(1, 30, 20, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(255, 251, 247, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: palette.cardLine,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#D8D3CC',
    marginBottom: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#FDE8D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFBF7',
  },
  title: {
    fontFamily: AppFonts.heading,
    fontSize: 22,
    color: palette.evergreen,
    textAlign: 'center',
  },
  body: {
    fontFamily: AppFonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: '#727974',
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: palette.amber,
    borderRadius: 999,
    minHeight: TapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryLabel: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: '#fff' },
  secondaryBtn: { paddingVertical: 10 },
  secondaryLabel: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.faded },
});
