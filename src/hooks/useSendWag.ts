import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { sendWag } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { usePetSocialStore } from '@/store/usePetSocialStore';

type Options = {
  targetPetId?: string;
  targetPetName?: string;
  initialWagged?: boolean;
};

export function useSendWag({ targetPetId, targetPetName, initialWagged = false }: Options) {
  const activePet = useAuthStore((s) => s.activePet);
  const waggedTargets = usePetSocialStore((s) => s.waggedTargets);
  const markWagged = usePetSocialStore((s) => s.markWagged);
  const [sending, setSending] = useState(false);

  const wagSent = Boolean(targetPetId && (waggedTargets[targetPetId] || initialWagged));
  const canWag = Boolean(
    targetPetId && activePet?.id && activePet.id !== targetPetId && !wagSent
  );

  const send = useCallback(async () => {
    if (!targetPetId || wagSent || sending) return false;
    if (!activePet?.id) {
      Alert.alert('Wag', 'Please log in with a pet profile to send a wag.');
      return false;
    }
    if (activePet.id === targetPetId) return false;

    setSending(true);
    try {
      await sendWag(targetPetId, activePet.id);
      markWagged(targetPetId);
      Alert.alert('Wag sent!', `You sent a tail wag to ${targetPetName || 'this pet'}! 🐾`);
      return true;
    } catch (err) {
      console.warn('[useSendWag] Send wag error:', err);
      Alert.alert('Wag', err instanceof Error ? err.message : 'Could not send wag. Try again.');
      return false;
    } finally {
      setSending(false);
    }
  }, [activePet?.id, markWagged, sending, targetPetId, targetPetName, wagSent]);

  return { wagSent, send, sending, canWag };
}
