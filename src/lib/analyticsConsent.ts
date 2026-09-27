import AsyncStorage from '@react-native-async-storage/async-storage'

export const ANALYTICS_CONSENT_KEY = 'furlo_analytics_consent'

export type AnalyticsConsent = 'granted' | 'denied' | null

type ConsentListener = (value: AnalyticsConsent) => void
const listeners = new Set<ConsentListener>()

export function subscribeAnalyticsConsent(listener: ConsentListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function readAnalyticsConsent(): Promise<AnalyticsConsent> {
  const value = await AsyncStorage.getItem(ANALYTICS_CONSENT_KEY)
  if (value === 'granted' || value === 'denied') return value
  return null
}

export async function writeAnalyticsConsent(value: AnalyticsConsent): Promise<void> {
  if (value) {
    await AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, value)
  } else {
    await AsyncStorage.removeItem(ANALYTICS_CONSENT_KEY)
  }
  listeners.forEach((listener) => listener(value))
}

export async function hasAnalyticsConsent(): Promise<boolean> {
  return (await readAnalyticsConsent()) === 'granted'
}
