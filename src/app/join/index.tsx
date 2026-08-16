import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { checkVerification, getMe, login, resendConfirmation, signup } from '@/api/auth';
import { GoogleIcon } from '@/components/GoogleIcon';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { getWebmailInfo } from '@/lib/email-helpers';
import { useAuthStore } from '@/store/useAuthStore';

type AuthMode = 'signup' | 'signin';

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<AuthMode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const { setOnboardingData } = useAuthStore();
  const isSignup = mode === 'signup';
  const webmailInfo = getWebmailInfo(pendingEmail);

  useEffect(() => {
    if (params.mode === 'signup') setMode('signup');
    else if (params.mode === 'signin') setMode('signin');
  }, [params.mode]);

  useEffect(() => {
    if (!verificationPending || !pendingEmail) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await checkVerification(pendingEmail);
        if (isMounted && res.verified) {
          clearInterval(interval);
          await finishVerifiedFlow();
        }
      } catch {
        // Silent poll — inbox may not be confirmed yet.
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll only while pending
  }, [verificationPending, pendingEmail]);

  async function finishVerifiedFlow() {
    try {
      await getMe({ skipUnauthorizedClear: true });
    } catch {
      const saved = useAuthStore.getState().onboardingData;
      const savedEmail = saved?.email || pendingEmail;
      const savedPassword = saved?.password;
      if (savedEmail && savedPassword) {
        try {
          await login(savedEmail, savedPassword);
        } catch {
          // Match web: still continue to role select.
        }
      }
    }
    router.replace('/join/select');
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      if (isSignup) {
        setOnboardingData({ email, password });
        const res = await signup(email, password);
        if (res.requiresVerification || !res.session) {
          setPendingEmail(email);
          setVerificationPending(true);
        } else {
          router.replace('/join/select');
        }
      } else {
        const res = await login(email, password);
        if (res.activePet) {
          router.replace('/feed');
        } else {
          router.replace('/join/select');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCheckVerification() {
    if (!pendingEmail || checkingStatus) return;
    setCheckingStatus(true);
    setError(null);

    try {
      const res = await checkVerification(pendingEmail);
      if (res.verified) {
        await finishVerifiedFlow();
      } else {
        setError('Email not confirmed yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not verify status. Please try clicking the link in your email.'
      );
    } finally {
      setCheckingStatus(false);
    }
  }

  async function handleResendEmail() {
    if (!pendingEmail || resendLoading) return;
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      await resendConfirmation(pendingEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend confirmation email.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {verificationPending ? (
              <View style={styles.cardInner}>
                <View style={styles.emailIconWrap}>
                  <Ionicons name="mail-unread-outline" size={32} color={palette.brown} />
                </View>
                <Text style={styles.title}>Verify your email address 📩</Text>
                <Text style={styles.body}>
                  We've sent a verification link to{' '}
                  <Text style={styles.emailHighlight}>{pendingEmail}</Text>.
                </Text>
                <Text style={styles.hint}>Click the link in your email to unlock your profile creation.</Text>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {resendSuccess ? (
                  <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    <Text style={styles.successText}>Confirmation link resent! Check your inbox.</Text>
                  </View>
                ) : null}

                <Pressable
                  style={StyleSheet.flatten([styles.primaryBtn, { minHeight: TapTarget }])}
                  onPress={() => WebBrowser.openBrowserAsync(webmailInfo.webmailUrl)}>
                  <Text style={styles.primaryLabel}>Open {webmailInfo.providerName}</Text>
                  <Ionicons name="open-outline" size={18} color="#fff" />
                </Pressable>

                <Pressable onPress={() => Linking.openURL(webmailInfo.mailtoUrl)}>
                  <Text style={styles.mailto}>Open in desktop email client ↗</Text>
                </Pressable>

                <View style={styles.dividerLine} />

                <Pressable
                  style={StyleSheet.flatten([styles.outlineBtn, { minHeight: TapTarget }])}
                  onPress={handleManualCheckVerification}
                  disabled={checkingStatus}>
                  {checkingStatus ? (
                    <>
                      <ActivityIndicator size="small" color={palette.ink} />
                      <Text style={styles.outlineLabel}>Checking status…</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.outlineLabel}>I've confirmed my email</Text>
                      <Ionicons name="arrow-forward" size={18} color={palette.brown} />
                    </>
                  )}
                </Pressable>

                <View style={styles.resendRow}>
                  <Text style={styles.bodySmall}>Didn't get the email?</Text>
                  <Pressable onPress={handleResendEmail} disabled={resendLoading}>
                    <Text style={styles.link}>{resendLoading ? 'Resending…' : 'Resend link'}</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    setVerificationPending(false);
                    setError(null);
                  }}>
                  <Text style={styles.backLink}>← Use a different email address</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.cardInner}>
                <View style={styles.brandRow}>
                  <Ionicons name="paw" size={26} color={palette.amber} />
                  <Text style={styles.brand}>furlo</Text>
                </View>

                <View style={styles.tabs}>
                  <Pressable
                    style={[styles.tab, isSignup && styles.tabActive]}
                    onPress={() => {
                      setMode('signup');
                      setError(null);
                    }}>
                    <Text style={[styles.tabLabel, isSignup && styles.tabLabelActive]}>New here</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tab, !isSignup && styles.tabActive]}
                    onPress={() => {
                      setMode('signin');
                      setError(null);
                    }}>
                    <Text style={[styles.tabLabel, !isSignup && styles.tabLabelActive]}>Pack Member</Text>
                  </Pressable>
                </View>

                <Text style={styles.headline}>
                  {isSignup ? 'Create your Furlo account' : 'Welcome back to Furlo 🐾'}
                </Text>
                <Text style={styles.subhead}>
                  {isSignup ? "Your pet's social life starts here 🐾" : 'Your pack missed you.'}
                </Text>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={StyleSheet.flatten([styles.googleBtn, { minHeight: TapTarget }])}
                  onPress={() =>
                    Alert.alert('Coming soon', 'Google sign-in will be available after email auth is working.')
                  }>
                  <GoogleIcon />
                  <Text style={styles.googleLabel}>Continue with Google</Text>
                </Pressable>

                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or connect with email</Text>
                  <View style={styles.orLine} />
                </View>

                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="alex@furlo.com"
                  placeholderTextColor={palette.border}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={[styles.input, emailFocused && styles.inputFocused]}
                />

                <Text style={styles.label}>Paw-sword</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor={palette.border}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType={isSignup ? 'newPassword' : 'password'}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={[styles.input, styles.passwordInput, passwordFocused && styles.inputFocused]}
                  />
                  <Pressable style={styles.eye} onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={palette.border}
                    />
                  </Pressable>
                </View>

                {!isSignup ? (
                  <Pressable style={styles.forgotWrap} onPress={() => router.push('/forgot-password')}>
                    <Text style={styles.link}>Forgot Paw-sword?</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={StyleSheet.flatten([
                    styles.primaryBtn,
                    { minHeight: TapTarget, opacity: loading ? 0.6 : 1 },
                  ])}
                  onPress={handleSubmit}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryLabel}>
                      {isSignup ? 'Join the Pack →' : 'Find Your Pack →'}
                    </Text>
                  )}
                </Pressable>

                <Text style={styles.switchText}>
                  {isSignup ? 'Already a Pack Member?' : 'Need to bark first?'}{' '}
                  <Text
                    style={styles.link}
                    onPress={() => {
                      setMode(isSignup ? 'signin' : 'signup');
                      setError(null);
                    }}>
                    {isSignup ? 'Find Your Pack' : 'Join the Pack'}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <View style={styles.brandRow}>
          <Ionicons name="paw" size={20} color="#fff" />
          <Text style={styles.footerBrand}>furlo</Text>
        </View>
        <Text style={styles.footerCopy}>© 2026 FURLO. Where Pets Belong.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    backgroundColor: palette.cream,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1c2329',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardInner: { padding: 24, gap: 12, alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontFamily: AppFonts.heading, fontSize: 22, color: palette.brown },
  tabs: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 999,
    padding: 4,
    backgroundColor: palette.tabTrack,
    borderWidth: 1,
    borderColor: 'rgba(219,193,179,0.3)',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  tabActive: { backgroundColor: palette.brown },
  tabLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: palette.muted },
  tabLabelActive: { color: '#fff' },
  headline: { fontFamily: AppFonts.headingSemi, fontSize: 20, color: palette.ink, textAlign: 'center' },
  subhead: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, textAlign: 'center', marginTop: -4 },
  title: { fontFamily: AppFonts.heading, fontSize: 22, color: palette.ink, textAlign: 'center' },
  body: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, textAlign: 'center', lineHeight: 22 },
  bodySmall: { fontFamily: AppFonts.body, fontSize: 13, color: palette.muted },
  hint: { fontFamily: AppFonts.body, fontSize: 13, color: palette.faded, textAlign: 'center' },
  emailHighlight: { fontFamily: AppFonts.bodySemi, color: palette.brown },
  emailIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f3',
    borderWidth: 1,
    borderColor: palette.border,
  },
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: { flex: 1, fontFamily: AppFonts.bodyMedium, fontSize: 13, color: '#991b1b', lineHeight: 18 },
  successBanner: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
  },
  successText: { flex: 1, fontFamily: AppFonts.body, fontSize: 13, color: '#065f46' },
  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
  },
  googleLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: palette.ink },
  orRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(219,193,179,0.5)' },
  orText: {
    fontFamily: AppFonts.bodyMedium,
    fontSize: 11,
    color: palette.faded,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  label: {
    alignSelf: 'flex-start',
    fontFamily: AppFonts.bodyMedium,
    fontSize: 12,
    color: palette.mutedGreen,
    marginLeft: 4,
    marginBottom: -4,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.cream,
    color: palette.ink,
    fontFamily: AppFonts.body,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  passwordWrap: { width: '100%' },
  passwordInput: { paddingRight: 48 },
  inputFocused: { borderColor: palette.brown },
  eye: { position: 'absolute', right: 16, top: 14 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  primaryBtn: {
    width: '100%',
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: palette.brown,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  primaryLabel: { fontFamily: AppFonts.headingSemi, fontSize: 15, color: '#fff' },
  outlineBtn: {
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  outlineLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: palette.ink },
  link: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.brown },
  mailto: { fontFamily: AppFonts.body, fontSize: 13, color: palette.faded, textDecorationLine: 'underline' },
  dividerLine: { width: '100%', height: 1, backgroundColor: 'rgba(219,193,179,0.5)' },
  resendRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  backLink: { fontFamily: AppFonts.body, fontSize: 13, color: palette.faded, marginTop: 8 },
  switchText: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, textAlign: 'center' },
  footer: {
    backgroundColor: palette.mutedGreen,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 6,
  },
  footerBrand: { fontFamily: AppFonts.heading, fontSize: 20, color: '#fff' },
  footerCopy: { fontFamily: AppFonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
});
