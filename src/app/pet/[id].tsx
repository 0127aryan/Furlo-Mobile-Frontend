import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { PetProfileView } from '@/components/profile/PetProfileView';
import { ProfileMenuSheet } from '@/components/profile/ProfileMenuSheet';
import { AppFonts, palette, TapTarget } from '@/constants/theme';

export default function PetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <ScreenBackButton />
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          style={styles.menuBtn}
          accessibilityLabel="Open menu">
          <Ionicons name="menu" size={24} color={palette.evergreen} />
        </Pressable>
      </View>
      {id ? <PetProfileView petId={id} /> : <Text style={styles.missing}>Pet not found</Text>}
      <ProfileMenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF9F3' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E1',
  },
  menuBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TapTarget,
    minWidth: TapTarget,
  },
  missing: { fontFamily: AppFonts.heading, fontSize: 18, color: palette.ink, textAlign: 'center', marginTop: 40 },
});
