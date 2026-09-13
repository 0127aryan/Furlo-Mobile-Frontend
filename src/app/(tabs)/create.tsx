import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { getCommunities } from '@/api/auth';
import { CreatePostForm } from '@/components/feed/CreatePostForm';
import { palette } from '@/constants/theme';
import { usePostVerb } from '@/hooks/usePostVerb';
import { useAuthStore } from '@/store/useAuthStore';
import type { Community } from '@/types/api';

export default function CreateScreen() {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);
  const { verbLower } = usePostVerb(activePet);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    getCommunities()
      .then(setCommunities)
      .catch(() => setCommunities([]));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.cream }} edges={['top']}>
      <CreatePostForm
        communities={communities}
        onCancel={() => router.replace('/feed')}
        onSuccess={() => {
          Alert.alert('Posted', `Your ${verbLower} is in The Yard.`);
          router.replace('/feed');
        }}
      />
    </SafeAreaView>
  );
}
