import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { FURLO_CONTACT_MAILTO, FURLO_INSTAGRAM_URL } from '@/constants/links';
import { AppFonts, palette } from '@/constants/theme';

type Props = {
  compact?: boolean;
};

export function CommunityDisclaimerFooter({ compact }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerStrong}>Community Advice:</Text> Content on Furlo is shared by pet lovers &
          owners and is not a substitute for professional veterinary guidance.
        </Text>
      </View>

      <View style={styles.connectRow}>
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(FURLO_INSTAGRAM_URL)}
          style={({ pressed }) => [styles.connectBtn, pressed && styles.connectBtnPressed]}>
          <Ionicons name="logo-instagram" size={14} color={palette.muted} />
          <Text style={styles.connectLabel}>Instagram</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(FURLO_CONTACT_MAILTO)}
          style={({ pressed }) => [styles.connectBtn, pressed && styles.connectBtnPressed]}>
          <Ionicons name="mail-outline" size={14} color={palette.muted} />
          <Text style={styles.connectLabel}>Contact Us</Text>
        </Pressable>
      </View>

      {!compact ? <Text style={styles.copyright}>© 2026 Furlo Inc.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, paddingTop: 16, borderTopWidth: 1, borderTopColor: palette.cardLine },
  wrapCompact: { paddingTop: 0, borderTopWidth: 0 },
  disclaimer: {
    backgroundColor: '#FFF9F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE8D3',
    padding: 12,
  },
  disclaimerText: { fontFamily: AppFonts.body, fontSize: 11, lineHeight: 17, color: '#6E5A4D' },
  disclaimerStrong: { fontFamily: AppFonts.bodySemi, color: '#8B2E0F' },
  connectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.cardLine,
    backgroundColor: '#fff',
  },
  connectBtnPressed: { backgroundColor: '#F8F3ED', borderColor: palette.border },
  connectLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.muted },
  copyright: { fontFamily: AppFonts.bodyMedium, fontSize: 11, color: '#727974' },
});
