import type { ReactNode } from 'react'
import { PostHogProvider } from 'posthog-react-native'

import { POSTHOG_HOST, POSTHOG_KEY } from '@/lib/posthogConfig'
import { AnalyticsConsentPrompt } from '@/components/AnalyticsConsentPrompt'
import { PostHogScreenTracker } from '@/components/PostHogScreenTracker'
import { SessionAnalyticsIdentify } from '@/components/SessionAnalyticsIdentify'

export function PostHogRootProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}</>
  }

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
      {children}
      <AnalyticsConsentPrompt />
    </PostHogProvider>
  )
}
