import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
} from '@/api/notifications';
import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { SettingsSkeleton } from '@/components/skeletons';
import { NotificationToggle } from '@/components/notifications/NotificationToggle';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import {
  DEFAULT_DEVICE_PREFS,
  getNotificationDevicePrefs,
  saveNotificationDevicePrefs,
} from '@/lib/notificationDevicePrefs';
import {
  getPushPermissionStatus,
  isExpoGoAndroidWithoutPush,
  isPushAvailableInCurrentRuntime,
  registerPushTokenWithBackend,
  requestPushPermission,
} from '@/lib/pushNotifications';
import type { NotificationDevicePrefs, NotificationSettings } from '@/types/api';

const TIME_OPTIONS = ['21:00', '22:00', '23:00', '07:00', '07:30', '08:00'];

function nextTime(current: string) {
  const idx = TIME_OPTIONS.indexOf(current);
  return TIME_OPTIONS[(idx + 1) % TIME_OPTIONS.length];
}

type SettingRowProps = {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

function SettingRow({ icon, title, description, value, onChange, disabled }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <NotificationToggle value={value} onValueChange={onChange} disabled={disabled} />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [devicePrefs, setDevicePrefs] = useState<NotificationDevicePrefs>(DEFAULT_DEVICE_PREFS);
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, prefs, status] = await Promise.all([
        getNotificationSettings(),
        getNotificationDevicePrefs(),
        getPushPermissionStatus(),
      ]);
      if (settingsRes.settings) {
        setSettings({
          ...settingsRes.settings,
          quiet_hours_enabled: settingsRes.settings.quiet_hours_enabled ?? prefs.quietHoursEnabled,
          quiet_hours_start: settingsRes.settings.quiet_hours_start ?? prefs.quietHoursStart,
          quiet_hours_end: settingsRes.settings.quiet_hours_end ?? prefs.quietHoursEnd,
        });
      }
      setDevicePrefs(prefs);
      setPushStatus(status);
      if (isPushAvailableInCurrentRuntime() && status === 'granted') {
        void registerPushTokenWithBackend();
      }
    } catch {
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const payload: NotificationSettings = {
        ...settings,
        quiet_hours_enabled: devicePrefs.quietHoursEnabled,
        quiet_hours_start: devicePrefs.quietHoursStart,
        quiet_hours_end: devicePrefs.quietHoursEnd,
        timezone,
      };
      await Promise.all([
        saveNotificationSettings(payload),
        saveNotificationDevicePrefs(devicePrefs),
      ]);
      setSettings(payload);
      showToast('Preferences saved 🐾');
    } catch {
      Alert.alert('Settings', 'Could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleMasterPush(next: boolean) {
    if (next) {
      if (isExpoGoAndroidWithoutPush()) {
        Alert.alert(
          'Development build required',
          'OS push notifications are not available in Expo Go on Android (SDK 53+). In-app alerts still work here. Use an EAS development build to test real push.'
        );
        return;
      }
      const status = await requestPushPermission();
      setPushStatus(status);
      if (status !== 'granted') {
        Alert.alert(
          'Push Notifications',
          'Enable notifications in your device settings to receive pack alerts.'
        );
      }
    }
    setSettings((prev) => ({
      ...prev,
      master_push_enabled: next,
      ...(next
        ? {}
        : {
            treats_enabled: false,
            comments_enabled: false,
            followers_enabled: false,
            qa_answers_enabled: false,
            qa_best_answer_enabled: false,
            pack_announcements_enabled: false,
          }),
    }));
  }

  const categoriesDisabled = !settings.master_push_enabled;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <ScreenBackButton fallbackHref="/notifications" />
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <SettingsSkeleton />
        </ScrollView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.masterCard}>
              <View style={styles.masterLeft}>
                <View style={styles.masterIcon}>
                  <Ionicons name="notifications" size={24} color={palette.amber} />
                </View>
                <View style={styles.masterText}>
                  <Text style={styles.masterTitle}>Push Notifications on this device</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: pushStatus === 'granted' ? '#15803D' : '#727974' },
                      ]}
                    />
                    <Text style={styles.statusLabel}>
                      {isExpoGoAndroidWithoutPush()
                        ? 'Expo Go — in-app only'
                        : pushStatus === 'granted'
                          ? 'Enabled'
                          : 'Disabled'}
                    </Text>
                  </View>
                </View>
              </View>
              <NotificationToggle
                value={settings.master_push_enabled && pushStatus === 'granted'}
                onValueChange={toggleMasterPush}
              />
            </View>

            <Text style={styles.sectionLabel}>Activity Categories</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="🐾"
                title="Treats & Likes"
                description="Notifications when pets give treats to your posts."
                value={settings.treats_enabled}
                onChange={(v) => setSettings((p) => ({ ...p, treats_enabled: v }))}
                disabled={categoriesDisabled}
              />
              <SettingRow
                icon="💬"
                title="Comments & Answers"
                description="Replies to your discussions or Q&A threads."
                value={settings.comments_enabled}
                onChange={(v) => setSettings((p) => ({ ...p, comments_enabled: v }))}
                disabled={categoriesDisabled}
              />
              <SettingRow
                icon="🐕"
                title="Followers & New Wags"
                description="Alerts when pet parents follow your pack."
                value={settings.followers_enabled}
                onChange={(v) => setSettings((p) => ({ ...p, followers_enabled: v }))}
                disabled={categoriesDisabled}
              />
              <SettingRow
                icon="⭐"
                title="Q&A & Best Answers"
                description="Updates when your answer is marked as Best Answer."
                value={settings.qa_best_answer_enabled && settings.qa_answers_enabled}
                onChange={(v) =>
                  setSettings((p) => ({
                    ...p,
                    qa_best_answer_enabled: v,
                    qa_answers_enabled: v,
                  }))
                }
                disabled={categoriesDisabled}
              />
              <SettingRow
                icon="📣"
                title="Pack Announcements"
                description="Important event & group alerts from joined packs."
                value={settings.pack_announcements_enabled}
                onChange={(v) => setSettings((p) => ({ ...p, pack_announcements_enabled: v }))}
                disabled={categoriesDisabled}
              />
            </View>

            <Text style={styles.sectionLabel}>Sound & Haptics</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="🔊"
                title="Play Sound"
                description="Custom bark/chime sound on notification arrival."
                value={devicePrefs.playSound}
                onChange={(v) => setDevicePrefs((p) => ({ ...p, playSound: v }))}
              />
              <SettingRow
                icon="📳"
                title="Haptic Feedback"
                description="Vibration pulse on receiving notifications."
                value={devicePrefs.hapticFeedback}
                onChange={(v) => setDevicePrefs((p) => ({ ...p, hapticFeedback: v }))}
              />
            </View>

            <Text style={styles.sectionLabel}>Quiet Hours Schedule</Text>
            <View style={styles.sectionCard}>
              <SettingRow
                icon="🌙"
                title="Enable Quiet Hours"
                description="Silence non-urgent alerts during rest time."
                value={devicePrefs.quietHoursEnabled}
                onChange={(v) => setDevicePrefs((p) => ({ ...p, quietHoursEnabled: v }))}
              />
              {devicePrefs.quietHoursEnabled ? (
                <View style={styles.timeRow}>
                  <Pressable
                    style={styles.timeCell}
                    onPress={() =>
                      setDevicePrefs((p) => ({ ...p, quietHoursStart: nextTime(p.quietHoursStart) }))
                    }>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <Text style={styles.timeValue}>{devicePrefs.quietHoursStart}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.timeCell}
                    onPress={() =>
                      setDevicePrefs((p) => ({ ...p, quietHoursEnd: nextTime(p.quietHoursEnd) }))
                    }>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <Text style={styles.timeValue}>{devicePrefs.quietHoursEnd}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {toast ? <Text style={styles.toast}>{toast}</Text> : null}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveLabel}>Save Preferences</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
  },
  headerTitle: {
    flex: 1,
    fontFamily: AppFonts.heading,
    fontSize: 20,
    color: palette.evergreen,
    textAlign: 'center',
  },
  headerSpacer: { width: TapTarget },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE8D3',
    padding: 16,
    gap: 12,
  },
  masterLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  masterIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterText: { flex: 1, gap: 6 },
  masterTitle: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.evergreen },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#727974' },
  sectionLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    color: palette.faded,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardLine,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
  },
  settingIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  settingText: { flex: 1, gap: 2 },
  settingTitle: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: palette.evergreen },
  settingDesc: { fontFamily: AppFonts.body, fontSize: 11, color: '#727974', lineHeight: 16 },
  timeRow: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 0 },
  timeCell: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  timeLabel: { fontFamily: AppFonts.body, fontSize: 11, color: '#727974' },
  timeValue: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: palette.evergreen },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(250, 247, 242, 0.96)',
    borderTopWidth: 1,
    borderTopColor: palette.cardLine,
    gap: 8,
  },
  toast: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: palette.mutedGreen,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: palette.amber,
    borderRadius: 999,
    minHeight: TapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: '#fff' },
});
