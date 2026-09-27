import { useEffect } from 'react'

import { setFirebaseAnalyticsEnabled } from '@/lib/firebaseAnalytics'
import { useAnalyticsConsent } from '@/lib/useAnalyticsConsent'

export function FirebaseAnalyticsBootstrap() {
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if (consent === 'loading') return
    void setFirebaseAnalyticsEnabled(consent === 'granted')
  }, [consent])

  return null
}
