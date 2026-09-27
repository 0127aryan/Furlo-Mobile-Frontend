const fs = require('fs')
const path = require('path')

const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713'
const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511'

function withStaticFrameworks(plugins) {
  const next = [...(plugins ?? [])]
  const index = next.findIndex((plugin) => {
    return plugin === 'expo-build-properties' || (Array.isArray(plugin) && plugin[0] === 'expo-build-properties')
  })
  const current = index >= 0 && Array.isArray(next[index]) ? next[index][1] ?? {} : {}
  const android = current.android ?? {}
  const ios = current.ios ?? {}
  const updated = [
    'expo-build-properties',
    {
      ...current,
      android,
      ios: {
        ...ios,
        useFrameworks: 'static',
        forceStaticLinking: ['RNFBApp', 'RNFBAnalytics'],
      },
    },
  ]
  if (index >= 0) next[index] = updated
  else next.push(updated)
  return next
}

module.exports = ({ config }) => {
  const isProduction = process.env.EAS_BUILD_PROFILE === 'production'
  const androidAppId =
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || (isProduction ? undefined : TEST_ANDROID_APP_ID)
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || (isProduction ? undefined : TEST_IOS_APP_ID)
  const iosServicesPath = path.join(__dirname, 'GoogleService-Info.plist')

  const plugins = withStaticFrameworks(config.plugins)
  plugins.push('@react-native-firebase/app', '@react-native-firebase/analytics')
  if (androidAppId && iosAppId) {
    plugins.push([
      'react-native-google-mobile-ads',
      {
        androidAppId,
        iosAppId,
        userTrackingUsageDescription:
          'Furlo uses this identifier to show more relevant ads. You can decline and still use the app.',
      },
    ])
  }

  return {
    ...config,
    ios: {
      ...config.ios,
      ...(fs.existsSync(iosServicesPath) ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    },
    plugins,
  }
}
