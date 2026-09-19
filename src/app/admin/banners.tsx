import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createAdminBanner, deleteAdminBanner, getAdminBanners, toggleAdminBanner } from '@/api/admin';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import type { AdminBannerItem, AdminBannerStyle } from '@/types/admin';

const STYLES: { id: AdminBannerStyle; label: string; bg: string; fg: string }[] = [
  { id: 'orange', label: 'Orange', bg: '#E8843A', fg: '#fff' },
  { id: 'emerald', label: 'Emerald', bg: '#15803D', fg: '#fff' },
  { id: 'amber', label: 'Amber', bg: '#F59E0B', fg: '#011E14' },
];

function styleColors(styleType: string) {
  return STYLES.find((s) => s.id === styleType) || STYLES[0];
}

export default function AdminBannersScreen() {
  const [banners, setBanners] = useState<AdminBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [ctaText, setCtaText] = useState('View Details');
  const [styleType, setStyleType] = useState<AdminBannerStyle>('orange');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getAdminBanners();
      setBanners(res.banners ?? []);
    } catch {
      Alert.alert('Banners', 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await createAdminBanner({
        text: text.trim(),
        linkUrl: linkUrl.trim() || undefined,
        ctaText: ctaText.trim() || 'View Details',
        styleType,
        isActive,
      });
      if (res.banner) {
        setBanners((prev) => [res.banner, ...prev]);
        setText('');
        setLinkUrl('');
      }
    } catch (err) {
      Alert.alert('Banners', err instanceof Error ? err.message : 'Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(banner: AdminBannerItem) {
    const next = !banner.is_active;
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: next } : b)));
    try {
      await toggleAdminBanner(banner.id, next);
    } catch (err) {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? banner : b)));
      Alert.alert('Banners', err instanceof Error ? err.message : 'Failed to toggle banner');
    }
  }

  async function handleDelete(id: string) {
    const previous = banners;
    setBanners((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteAdminBanner(id);
    } catch (err) {
      setBanners(previous);
      Alert.alert('Banners', err instanceof Error ? err.message : 'Failed to delete banner');
    }
  }

  const preview = styleColors(styleType);

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Global Announcement Banners</Text>
      <Text style={styles.sub}>
        Configure site-wide top announcement banners for events, community alerts, and platform news.
      </Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Create New Banner</Text>
        <Text style={styles.label}>Banner Text</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Announcement copy"
          placeholderTextColor={adminColors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>CTA Label</Text>
        <TextInput
          value={ctaText}
          onChangeText={setCtaText}
          placeholder="View Details"
          placeholderTextColor={adminColors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>Link URL</Text>
        <TextInput
          value={linkUrl}
          onChangeText={setLinkUrl}
          placeholder="/qa or https://..."
          placeholderTextColor={adminColors.muted}
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.label}>Style</Text>
        <View style={styles.styleRow}>
          {STYLES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setStyleType(item.id)}
              style={[styles.styleChip, styleType === item.id && { backgroundColor: item.bg }]}>
              <Text style={[styles.styleLabel, styleType === item.id && { color: item.fg }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Active on publish</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ true: adminColors.emeraldBadge, false: adminColors.line }}
          />
        </View>
        <View style={[styles.preview, { backgroundColor: preview.bg }]}>
          <Text style={[styles.previewText, { color: preview.fg }]}>
            {text.trim() || 'Live preview of your announcement'}
          </Text>
          <Text style={[styles.previewCta, { color: preview.fg }]}>{ctaText || 'View Details'}</Text>
        </View>
        <Pressable disabled={!text.trim() || submitting} onPress={handleCreate} style={styles.primary}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryLabel}>Publish banner</Text>}
        </Pressable>
      </View>

      <Text style={styles.h2}>Banner History</Text>
      {loading ? (
        <ActivityIndicator color={adminColors.accent} />
      ) : banners.length === 0 ? (
        <Text style={styles.sub}>No banners yet.</Text>
      ) : (
        banners.map((banner) => {
          const colors = styleColors(banner.style_type);
          return (
            <View key={banner.id} style={styles.card}>
              <View style={[styles.preview, { backgroundColor: colors.bg }]}>
                <Text style={[styles.previewText, { color: colors.fg }]}>{banner.text}</Text>
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.label}>{banner.is_active ? 'Active' : 'Inactive'}</Text>
                <Switch
                  value={banner.is_active}
                  onValueChange={() => handleToggle(banner)}
                  trackColor={{ true: adminColors.emeraldBadge, false: adminColors.line }}
                />
              </View>
              <Pressable onPress={() => handleDelete(banner.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  h1: { fontFamily: AppFonts.heading, fontSize: 26, color: adminColors.evergreen },
  h2: { fontFamily: AppFonts.heading, fontSize: 18, color: adminColors.evergreen },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 16,
    gap: 10,
  },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: adminColors.evergreen },
  input: {
    minHeight: TapTarget,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: adminColors.cream,
    paddingHorizontal: 14,
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: adminColors.evergreen,
  },
  styleRow: { flexDirection: 'row', gap: 8 },
  styleChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: adminColors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: adminColors.evergreen },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { borderRadius: 12, padding: 12, gap: 6 },
  previewText: { fontFamily: AppFonts.bodySemi, fontSize: 13 },
  previewCta: { fontFamily: AppFonts.body, fontSize: 11, textDecorationLine: 'underline' },
  primary: {
    minHeight: TapTarget,
    borderRadius: 999,
    backgroundColor: adminColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  deleteBtn: {
    minHeight: TapTarget - 6,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.redBadge },
});
