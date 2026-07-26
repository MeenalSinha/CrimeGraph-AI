# CrimeGraph AI -- Mobile Companion

A native mobile companion app (Expo Router / React Native) for field officers: a
smaller, focused surface over the same backend API used by the web dashboard --
Command Center KPIs, case list and AI investigation briefs, a network-intelligence
summary, and alerts. Not a full port of every web module (see scope below).

## Run it

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `i` / `a`
in the terminal for a simulator/emulator, or `w` for a web preview.

Set the backend URL either in `app.json` under `expo.extra.apiBase`, or via an
`EXPO_PUBLIC_API_BASE` environment variable -- defaults to `http://localhost:8000`.
When testing on a physical device, `localhost` means the phone itself, so point it
at your machine's LAN IP instead (e.g. `http://192.168.1.20:8000`).

Demo login: any of `admin` / `commissioner` / `inspector` / `analyst` / `viewer`,
password `demo1234`.

## What's real vs. what's scoped down

This is a genuine Expo Router / React Native app -- not a wrapped web view. Every
screen calls the real backend endpoints through `lib/api.ts`.

**Verified while building this:**
- `npx tsc --noEmit` passes with zero errors across the whole app.
- `npx expo export --platform web` succeeds and produces real bundles for all 12
  routes (index, login, the 4 tabs, case detail, sitemap, etc.) -- this compiles
  the same React Native codebase through react-native-web, which is a genuine
  correctness check of the component tree, navigation config, and API client.

**Not verified (and honestly can't be, in the sandbox this was built in):**
- Actual iOS/Android builds and on-device behavior -- that needs Xcode/Android
  Studio or EAS Build, and a real device or emulator, neither of which is
  available in the environment this repository was authored in. Run
  `npx expo start` and open it in Expo Go yourself before demoing on stage.

**Deliberately out of scope for this companion app** (full parity lives on the
web dashboard):
- The interactive force-directed graph explorer (Network tab here shows the two
  most useful summaries -- top-centrality persons and detected clusters -- as
  lists instead).
- Prediction sliders / scenario simulator / patrol route map.
- PDF report downloads.
- Voice interface (the web app has this via the Web Speech API; native voice
  would use `expo-speech` for output, which is already a dependency here, plus
  a native speech-to-text module for input -- wire-up left for a follow-up pass).

## Offline-first behavior

`lib/api.ts` implements the same idea as the web app's service worker, adapted
for React Native: every GET request tries the network first (6s timeout), and on
any failure falls back to the last successful response cached in AsyncStorage,
tagged with how long ago it was fetched. Every screen shows a visible
"OFFLINE -- showing data cached Xm ago" badge when it's serving cached data,
rather than silently presenting stale numbers as live -- this matters for an
operational policing tool. Writes (login, chat) are never cached and always
require a live connection.

## Folder structure

```
mobile/
├── app.json              <- Expo config (icons, splash, bundle IDs, API base)
├── package.json
├── tsconfig.json
├── babel.config.js
├── app/                  <- Expo Router file-based routes
│   ├── _layout.tsx        <- root stack
│   ├── index.tsx           <- redirects to /login or /(tabs) based on stored token
│   ├── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx     <- bottom tab navigator
│   │   ├── index.tsx       <- Command Center (KPIs + ward risk ranking)
│   │   ├── cases.tsx       <- case list
│   │   ├── network.tsx     <- centrality + community summary
│   │   └── alerts.tsx
│   └── cases/[id].tsx      <- case detail / AI investigation brief
├── components/
│   └── CacheBadge.tsx     <- "offline, showing cached data" indicator
├── lib/
│   ├── api.ts             <- offline-first fetch client + AsyncStorage cache
│   └── theme.ts            <- shared color tokens (matches the web dashboard)
└── assets/                <- generated icon/splash images
```
