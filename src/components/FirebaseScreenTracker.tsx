import { useEffect } from 'react'
import { usePathname } from 'expo-router'

import { logFirebaseScreen } from '@/lib/firebaseAnalytics'
import { useAnalyticsConsent } from '@/lib/useAnalyticsConsent'

export function FirebaseScreenTracker() {
  const pathname = usePathname()
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if (consent !== 'granted' || !pathname) return
    void logFirebaseScreen(pathname)
  }, [pathname, consent])

  return null
}
