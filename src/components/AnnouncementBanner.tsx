import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getActiveBanner } from '@/api/admin';
import { AppFonts } from '@/constants/theme';
import { subscribeBanners, type ActiveBanner } from '@/lib/subscribeBanners';

const HIDDEN_PREFIXES = ['/join', '/forgot-password'];

function bannerTheme(styleType?: string) {
  if (styleType === 'emerald') return { bg: '#163328', fg: '#fff' };
  if (styleType === 'amber') return { bg: '#D97706', fg: '#fff' };
  return { bg: '#E8843A', fg: '#fff' };
}

type Props = {
  onVisibleChange?: (visible: boolean) => void;
};

export function AnnouncementBanner({ onVisibleChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<ActiveBanner | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  async function fetchBanner() {
    try {
      const res = await getActiveBanner();
      if (res.banner && res.banner.is_active !== false) {
        setBanner(res.banner);
      } else {
        setBanner(null);
      }
    } catch {
      // Keep the last known banner if the public fetch fails.
    }
  }

  useEffect(() => {
    void fetchBanner();
    const unsub = subscribeBanners((next) => {
      if (next) {
        setBanner(next);
        return;
      }
      void fetchBanner();
    });
    const poll = setInterval(() => {
      void fetchBanner();
    }, 30000);
    return () => {
      unsub();
      clearInterval(poll);
    };
  }, []);

  const hide = !pathname || pathname === '/' || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const visible = Boolean(!hide && banner && banner.id !== dismissedId);

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  if (!visible || !banner) return null;

  const theme = bannerTheme(banner.style_type);

  async function openLink() {
    const href = banner?.link_url?.trim();
    if (!href) return;
    if (href.startsWith('/')) {
      router.push(href as never);
      return;
    }
    try {
      await Linking.openURL(href);
    } catch {
      // Ignore invalid external links.
    }
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <Ionicons name="megaphone-outline" size={16} color={theme.fg} />
        <Text style={[styles.text, { color: theme.fg }]} numberOfLines={2}>
          {banner.text}
        </Text>
        {banner.link_url ? (
          <Pressable onPress={() => void openLink()} style={styles.cta}>
            <Text style={styles.ctaLabel}>{banner.cta_text || 'View Details'}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => setDismissedId(banner.id)}
          hitSlop={8}
          style={styles.close}
          accessibilityLabel="Dismiss announcement">
          <Ionicons name="close" size={16} color={theme.fg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flex: 1, fontFamily: AppFonts.bodySemi, fontSize: 12, lineHeight: 16 },
  cta: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ctaLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#fff' },
  close: { padding: 2 },
});
