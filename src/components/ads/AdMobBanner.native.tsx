import { useEffect } from 'react'
import { Platform } from 'react-native'
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'

import { useAnalyticsConsent } from '@/lib/useAnalyticsConsent'

function bannerUnitId() {
  if (__DEV__) return TestIds.BANNER
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS
    : process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID
}

export function AdMobBanner() {
  const consent = useAnalyticsConsent()
  const unitId = bannerUnitId()

  useEffect(() => {
    if (consent !== 'granted' || !unitId) return
    mobileAds()
      .initialize()
      .catch(() => undefined)
  }, [consent, unitId])

  if (consent !== 'granted' || !unitId) return null

  return <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
}
