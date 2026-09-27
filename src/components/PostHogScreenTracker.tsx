import { useEffect } from 'react'
import { usePathname } from 'expo-router'
import { usePostHog } from 'posthog-react-native'

import { hasAnalyticsConsent } from '@/lib/analyticsConsent'

export function PostHogScreenTracker() {
  const pathname = usePathname()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog || !pathname) return
    hasAnalyticsConsent().then((granted) => {
      if (!granted) return
      posthog.screen(pathname)
    })
  }, [pathname, posthog])

  return null
}
