import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { PetProfileView } from '@/components/profile/PetProfileView';
import { AppFonts, palette } from '@/constants/theme';

export default function PetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.top}>
          <ScreenBackButton />
        </View>
        <Text style={styles.missing}>Pet not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <ScreenBackButton />
      </View>
      <PetProfileView petId={id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF9F3' },
  top: { paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#EDE8E1' },
  missing: { fontFamily: AppFonts.heading, fontSize: 18, color: palette.ink, textAlign: 'center', marginTop: 40 },
});
