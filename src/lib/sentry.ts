import * as Sentry from '@sentry/react-native'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
const isProd = !__DEV__

if (dsn) {
  Sentry.init({
    dsn,
    environment: isProd ? 'production' : 'development',
    enabled: isProd,
    tracesSampleRate: isProd ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
      }
      return event
    },
  })
}

export { Sentry }
