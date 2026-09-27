import { useEffect, useState } from 'react'

import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/analyticsConsent'

export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<AnalyticsConsent | 'loading'>('loading')

  useEffect(() => {
    let cancelled = false
    readAnalyticsConsent().then((value) => {
      if (!cancelled) setConsent(value)
    })
    const unsubscribe = subscribeAnalyticsConsent((value) => setConsent(value))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return consent
}
