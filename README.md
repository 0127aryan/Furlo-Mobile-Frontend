# Furlo Mobile

Expo (React Native) app. TypeScript + `expo-router` (`src/app`). `@/` maps to `src/`.

## Commands

```bash
npm install          # install deps (also patches Metro for OneDrive)
npm start            # expo start
npx expo start       # same as npm start
npm run android      # native Android build + run
npm run ios          # native iOS build + run (macOS only)
npm run web          # Expo web
npm run lint         # expo lint
```

After `npm start`, press `a` to open on an Android emulator. iOS Simulator requires macOS.

## Setup

1. Start the backend (`cd ../Furlo-Backend && npm run dev`) so the API is on port **4000**.
2. Install and start Metro:

```bash
npm install
npm start
```

The API URL is resolved in this order:

1. `EXPO_PUBLIC_API_URL` (if set)
2. Metro LAN host, port `4000` (physical device)
3. `app.json` `extra.apiUrl` (default `http://10.0.2.2:4000`)
4. Android emulator → `http://10.0.2.2:4000`
5. Otherwise → `http://localhost:4000`

Optional `.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000
```

Android push uses `google-services.json` in this folder.

## EAS builds

```bash
npx eas-cli build --profile development --platform android
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform android
```

Profiles are in `eas.json` (`development` = dev client APK, `preview` = internal APK, `production` = Play Store AAB).
