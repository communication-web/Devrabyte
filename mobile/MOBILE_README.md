# House of Jade — Mobile App

React Native / Expo app for House of Jade, powered by Devrabyte AI Ops.

The mobile app connects directly to the **same Next.js backend** as the web dashboard —
no separate API. All your data, tasks, orders, team, and AI assistant are shared.

---

## What's in the app

| Tab | Screen |
|-----|--------|
| Home | Dashboard — KPIs, due today, alerts, activity feed |
| Tasks | Full task list with scope filters (mine / overdue / blocked / due today), status updates |
| AI | Natural language assistant — create tasks, ask questions, get summaries |
| Team | Team members with workload counts |
| More | Daily summary, bottleneck scan, settings, sign out |

---

## Quick start (local)

### Prerequisites
- Node 20+ and npm / pnpm
- [Expo Go](https://expo.dev/go) installed on your phone (for development testing)
- Your Devrabyte web app deployed and accessible at a URL

```bash
cd mobile
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your live web app URL
npm install
npx expo start
```

Scan the QR code in Expo Go on your phone. The app loads instantly.

---

## Build an APK (Android)

### Option A — EAS Build (recommended, no local Android SDK needed)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. Initialise the project (first time only):
   ```bash
   cd mobile
   eas init
   # This gives you a project ID — paste it into app.json > extra.eas.projectId
   ```

3. Build a preview APK:
   ```bash
   eas build --platform android --profile preview
   ```
   EAS builds it in the cloud (~10–15 minutes). You get a download link for the `.apk` file.

4. Share the APK directly with your team via the link, or install via the EAS dashboard.

### Option B — Local build (requires Android Studio)
```bash
npx expo run:android
```

---

## Build for iPhone (iOS)

### Option A — EAS Build (recommended)

You need an **Apple Developer account** ($99/year from developer.apple.com).

1. Register your app bundle ID (`ai.devrabyte.houseofjade`) in your Apple Developer account.

2. Build:
   ```bash
   eas build --platform ios --profile preview
   ```
   EAS handles signing automatically with Managed credentials.
   Build takes ~15–20 minutes. You get an `.ipa` download link.

3. To test before App Store submission, use **TestFlight**:
   ```bash
   eas submit --platform ios
   ```
   Then invite testers via App Store Connect.

### Option B — Simulator (no Apple account needed, Mac only)
```bash
npx expo run:ios
```
Runs in the iOS simulator on your Mac. Does not produce a real device build.

---

## Publish to stores

### Google Play Store

1. Build a release bundle (AAB):
   ```bash
   eas build --platform android --profile production
   ```

2. Go to [play.google.com/console](https://play.google.com/console) → Create app → Upload the `.aab` file.

3. Complete the store listing (description, screenshots, privacy policy).

4. Submit for review (~1–3 days approval).

### Apple App Store

1. Build a release IPA:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit:
   ```bash
   eas submit --platform ios --profile production
   ```

3. In [App Store Connect](https://appstoreconnect.apple.com), complete the listing and submit for review (~1–3 days).

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL of your deployed Devrabyte web app (no trailing slash) |
| `EXPO_PUBLIC_BRAND_NAME` | Brand name shown in the UI (default: House of Jade) |
| `EXPO_PUBLIC_POWERED_BY` | Powered-by label (default: Devrabyte) |

`EXPO_PUBLIC_*` variables are baked into the build at build time.

---

## White-labelling for other brands

To reuse this app for a different brand:

1. Change `EXPO_PUBLIC_BRAND_NAME` in `.env`
2. Change `name` and `slug` in `app.json`
3. Change `bundleIdentifier` (iOS) and `package` (Android) in `app.json`
4. Replace `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png`
5. Update colours in `lib/theme.ts` — change `brand.deep`, `brand.mid`, `brand.gold`
6. Point `EXPO_PUBLIC_API_URL` at the correct backend

That's it. One mobile app template, infinite brands — all powered by Devrabyte.

---

## Tech stack

- **Expo SDK 51** — managed workflow
- **Expo Router** — file-based navigation (same pattern as Next.js)
- **React Native 0.74**
- **EAS Build** — cloud-based APK/IPA compilation
- **expo-secure-store** — encrypted token storage
- **Ionicons** — icon set

---

## File structure

```
mobile/
├── app/
│   ├── _layout.tsx          ← root layout, AuthProvider
│   ├── index.tsx            ← redirect to tabs or login
│   ├── (auth)/
│   │   └── login.tsx        ← House of Jade branded login
│   └── (tabs)/
│       ├── _layout.tsx      ← bottom tab bar
│       ├── dashboard.tsx    ← home screen, KPIs
│       ├── tasks.tsx        ← task list + status updates
│       ├── ai.tsx           ← AI chat interface
│       ├── team.tsx         ← team members
│       └── more.tsx         ← reports, settings, logout
├── lib/
│   ├── api.ts               ← all API calls to the Devrabyte backend
│   ├── auth.tsx             ← auth context + hook
│   └── theme.ts             ← colours, spacing, typography tokens
├── assets/                  ← icon, splash, adaptive-icon (add your own)
├── app.json                 ← Expo + EAS config
├── eas.json                 ← EAS build profiles
└── package.json
```
