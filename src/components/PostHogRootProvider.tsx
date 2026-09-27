import { useEffect, type ReactNode } from 'react'
import { PostHogProvider, usePostHog } from 'posthog-react-native'

import { AnalyticsConsentPrompt } from '@/components/AnalyticsConsentPrompt'
import { FirebaseAnalyticsBootstrap } from '@/components/FirebaseAnalyticsBootstrap'
import { FirebaseScreenTracker } from '@/components/FirebaseScreenTracker'
import { PostHogScreenTracker } from '@/components/PostHogScreenTracker'
import { SessionAnalyticsIdentify } from '@/components/SessionAnalyticsIdentify'
import { POSTHOG_HOST, POSTHOG_KEY } from '@/lib/posthogConfig'
import { useAnalyticsConsent } from '@/lib/useAnalyticsConsent'

function PostHogConsentSync() {
  const posthog = usePostHog()
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if (!posthog || consent === 'loading' || consent === null) return
    if (consent === 'granted') posthog.optIn()
    else posthog.optOut()
  }, [posthog, consent])

  return null
}

export function PostHogRootProvider({ children }: { children: ReactNode }) {
  const shell = (
    <>
      <FirebaseAnalyticsBootstrap />
      <FirebaseScreenTracker />
      {children}
      <AnalyticsConsentPrompt />
    </>
  )

  if (!POSTHOG_KEY) return shell

  return (
    <PostHogProvider
      apiKey={POSTHOG_KEY}
      options={{
        host: POSTHOG_HOST,
        opt_out_capturing_by_default: true,
        person_profiles: 'identified_only',
      }}
      autocapture={false}
    >
      <PostHogScreenTracker />
      <SessionAnalyticsIdentify />
      <PostHogConsentSync />
      {shell}
    </PostHogProvider>
  )
}
