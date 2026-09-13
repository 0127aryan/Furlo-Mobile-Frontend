import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { AppFonts, palette, TapTarget } from '@/constants/theme';

type RecoveryState = 'form' | 'sent';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [state, setState] = useState<RecoveryState>('form');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown() {
    setCountdown(60);
    setResendEnabled(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setResendEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit() {
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setState('sent');
    startCountdown();
  }

  function handleResend() {
    if (!resendEnabled) return;
    startCountdown();
  }

  function handleGoBack() {
    if (timerRef.current) clearInterval(timerRef.current);
    setState('form');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        <View style={styles.card}>
          {state === 'form' ? (
            <>
              <ScreenBackButton onPress={() => router.replace('/join')} color={palette.mutedGreen} />

              <View style={styles.pawWrap}>
                <Ionicons name="paw" size={48} color={palette.forest} />
              </View>

              <Text style={styles.title}>Forgot your Paw-sword?</Text>
              <Text style={styles.body}>
                No sweat! Enter your email below and we'll sniff out a reset link for you.
              </Text>

              <Text style={styles.label}>Recovery Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. bark@furlo.com"
                placeholderTextColor={palette.border}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={[styles.input, focused && styles.inputFocused]}
              />

              <Pressable
                style={StyleSheet.flatten([
                  styles.cta,
                  { minHeight: TapTarget, opacity: loading || !email ? 0.6 : 1 },
                ])}
                onPress={handleSubmit}
                disabled={loading || !email}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaLabel}>Send Reset Link</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Ionicons name="paw-outline" size={64} color={palette.brown} />
              <Text style={styles.title}>Check your inbox 🐾</Text>
              <Text style={styles.body}>
                We've sent a recovery link to your registered email. Don't forget to check your spam folder!
              </Text>

              {!resendEnabled && countdown > 0 ? (
                <Text style={styles.countdown}>
                  Didn't get it? Resend Email in <Text style={styles.countdownStrong}>{countdown}</Text>s
                </Text>
              ) : null}

              <Pressable onPress={handleResend} disabled={!resendEnabled}>
                <Text style={[styles.resend, !resendEnabled && styles.resendDisabled]}>Resend Email</Text>
              </Pressable>

              <View style={styles.sentDivider} />
              <Pressable style={styles.back} onPress={handleGoBack}>
                <Ionicons name="arrow-back" size={18} color={palette.mutedGreen} />
                <Text style={styles.backLabel}>Wrong email? Go back</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream, justifyContent: 'center', padding: 16 },
  flex: { width: '100%' },
  card: {
    backgroundColor: palette.cream,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: palette.mutedGreen },
  pawWrap: {
    borderRadius: 999,
    padding: 16,
    backgroundColor: '#c9ead9',
    marginVertical: 8,
  },
  title: { fontFamily: AppFonts.heading, fontSize: 22, color: palette.ink, textAlign: 'center' },
  body: {
    fontFamily: AppFonts.body,
    fontSize: 15,
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  label: {
    alignSelf: 'flex-start',
    fontFamily: AppFonts.bodyMedium,
    fontSize: 12,
    color: palette.mutedGreen,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: palette.ink,
    fontFamily: AppFonts.body,
    fontSize: 16,
  },
  inputFocused: { borderColor: palette.brown },
  cta: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaLabel: { fontFamily: AppFonts.headingSemi, fontSize: 18, color: '#fff' },
  countdown: { fontFamily: AppFonts.body, fontSize: 13, color: palette.faded, textAlign: 'center' },
  countdownStrong: { fontFamily: AppFonts.bodySemi, color: palette.brown },
  resend: { fontFamily: AppFonts.heading, fontSize: 14, color: palette.mutedGreen },
  resendDisabled: { opacity: 0.4 },
  sentDivider: { height: 1, width: '100%', backgroundColor: palette.border, marginTop: 12 },
});
