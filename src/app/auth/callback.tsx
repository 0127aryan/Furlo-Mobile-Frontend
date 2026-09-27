import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { exchangeOAuthCode } from '@/api/auth';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { AppFonts, palette } from '@/constants/theme';

function paramsFromUrl(url: string | null): {
  code?: string;
  state?: string;
  error?: string;
} {
  if (!url) return {};
  const parsed = Linking.parse(url);
  const q = parsed.queryParams ?? {};
  const code = typeof q.code === 'string' ? q.code : undefined;
  const state = typeof q.state === 'string' ? q.state : undefined;
  const error =
    (typeof q.error_description === 'string' ? q.error_description : undefined) ??
    (typeof q.error === 'string' ? q.error : undefined);
  return { code, state, error };
}

/**
 * Fallback when the app opens via deep link or cold start after Google OAuth.
 * Primary flow completes in startGoogleSignIn() on the join screen.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      let code = typeof searchParams.code === 'string' ? searchParams.code : undefined;
      let state = typeof searchParams.state === 'string' ? searchParams.state : undefined;
      const errMsg =
        (typeof searchParams.error_description === 'string'
          ? searchParams.error_description
          : undefined) ??
        (typeof searchParams.error === 'string' ? searchParams.error : undefined);

      if (!code) {
        const initial = await Linking.getInitialURL();
        const fromUrl = paramsFromUrl(initial);
        code = code ?? fromUrl.code;
        state = state ?? fromUrl.state;
        if (!errMsg && fromUrl.error) {
          if (!cancelled) setError(fromUrl.error);
          return;
        }
      }

      if (errMsg) {
        if (!cancelled) setError(String(errMsg));
        return;
      }

      if (!code) {
        if (!cancelled) {
          router.replace('/join?mode=signin');
        }
        return;
      }

      try {
        const data = await exchangeOAuthCode(code, state);
        if (cancelled) return;
        if (data.activePet) {
          router.replace('/feed');
        } else {
          router.replace('/join/select');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Sign-in failed.');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [
    searchParams.code,
    searchParams.state,
    searchParams.error,
    searchParams.error_description,
    router,
  ]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: palette.cream }}>
        <Text style={{ fontFamily: AppFonts.heading, fontSize: 18, color: palette.charcoal, marginBottom: 8 }}>
          Sign-in failed
        </Text>
        <Text style={{ fontFamily: AppFonts.body, color: palette.muted, marginBottom: 16 }}>{error}</Text>
        <Text
          style={{ fontFamily: AppFonts.bodySemi, color: palette.brown }}
          onPress={() => router.replace('/join?mode=signin')}>
          Back to join →
        </Text>
      </View>
    );
  }

  return <FurloLoadingScreen caption="Signing you in" />;
}
