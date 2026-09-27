import { getApp } from '@react-native-firebase/app'
import { getAnalytics, logScreenView, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics'

export async function setFirebaseAnalyticsEnabled(enabled: boolean) {
  try {
    await setAnalyticsCollectionEnabled(getAnalytics(getApp()), enabled)
  } catch (error) {
    console.warn('[firebase-analytics] collection toggle failed', error)
  }
}

export async function logFirebaseScreen(pathname: string) {
  try {
    const analytics = getAnalytics(getApp())
    await setAnalyticsCollectionEnabled(analytics, true)
    await logScreenView(analytics, {
      screen_name: pathname,
      screen_class: pathname,
    })
  } catch (error) {
    console.warn('[firebase-analytics] screen view failed', error)
  }
}
