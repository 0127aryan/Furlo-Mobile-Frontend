import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetProfileView } from '@/components/profile/PetProfileView';
import { AppFonts, palette } from '@/constants/theme';

export default function PetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.missing}>Pet not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color="#011E14" />
          <Text style={styles.backLabel}>Back to Yard</Text>
        </Pressable>
      </View>
      <PetProfileView petId={id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF9F3' },
  top: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#EDE8E1' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  backLabel: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#011E14' },
  missing: { fontFamily: AppFonts.heading, fontSize: 18, color: palette.ink, textAlign: 'center', marginTop: 40 },
});
