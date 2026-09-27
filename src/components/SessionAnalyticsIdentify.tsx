import { useEffect } from 'react'
import { usePostHog } from 'posthog-react-native'

import { hasAnalyticsConsent } from '@/lib/analyticsConsent'
import { useAuthStore } from '@/store/useAuthStore'

export function SessionAnalyticsIdentify() {
  const posthog = usePostHog()
  const user = useAuthStore((s) => s.user)
  const activePet = useAuthStore((s) => s.activePet)

  useEffect(() => {
    if (!posthog || !user?.id) return
    hasAnalyticsConsent().then((granted) => {
      if (!granted) return
      posthog.identify(user.id, activePet?.id ? { active_pet_id: activePet.id } : undefined)
    })
  }, [posthog, user?.id, activePet?.id])

  return null
}
