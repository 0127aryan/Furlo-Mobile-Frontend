import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { palette } from '@/constants/theme'
import { writeAnalyticsConsent } from '@/lib/analyticsConsent'
import { useAnalyticsConsent } from '@/lib/useAnalyticsConsent'

export function AnalyticsConsentPrompt() {
  const consent = useAnalyticsConsent()

  if (consent !== null) {
    return null
  }

  const accept = () => {
    void writeAnalyticsConsent('granted')
  }

  const decline = () => {
    void writeAnalyticsConsent('denied')
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Help us improve Furlo</Text>
          <Text style={styles.body}>
            Optional analytics from Firebase and PostHog help us understand which features work. Ads
            from Google help support the app. You can decline and keep using Furlo. Crash reports use
            Sentry.
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={decline}>
              <Text style={styles.secondaryText}>Not now</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={accept}>
              <Text style={styles.primaryText}>Allow</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(1, 30, 20, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  card: {
    backgroundColor: palette.cream,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: palette.charcoal,
    marginBottom: 8,
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: palette.muted,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: palette.charcoal,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.amber,
  },
  primaryText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
})
