# Expo HAS CHANGED

This project is pinned to **Expo SDK 54**. Read the exact versioned docs at
https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Load-bearing version pins — do not bump

Expo Go SDK 54 ships specific native binaries. These JS packages must match
exactly or the app dies at startup with `Exception in HostFunction: <unknown>`
and no useful stack trace:

- `react-native-reanimated`: `4.1.1` — exact. `~4.1.1` resolves to 4.1.7+, which
  pulls worklets 0.8.3 and calls JSI HostFunctions that don't exist in Expo Go's
  bundled worklets 0.5.1 binary.
- `react-native-worklets`: `0.5.1` — explicit pin required, or npm resolves 0.9.1
  (which wants RN 0.83+; this project is on RN 0.81.5).
- `react-native-gesture-handler`: `~2.28.0`

## iOS deployment target

`ios.minimumOsVersion` in `app.json` **is not a real Expo config field.** Expo's
schema rejects it (`npx expo-doctor` reports "Additional property
minimumOsVersion is not allowed") and the build silently falls back to the SDK
floor — iOS 15.1 for SDK 54, per `expo-modules-core`'s podspec. The config reads
as if it works, which is the dangerous part.

The real knob is the `expo-build-properties` plugin:

```json
"plugins": [["expo-build-properties", { "ios": { "deploymentTarget": "16.0" } }]]
```

Verify it landed with `npx expo config --type introspect`, which should show
`'ios.deploymentTarget': '16.0'` under `ios.podfileProperties`. That is the value
written to `ios/Podfile.properties.json` at prebuild.

`ios.buildNumber` is likewise ignored, because `eas.json` sets
`appVersionSource: "remote"` — EAS owns the build number and `autoIncrement`
bumps it. `expo.version` *is* still read from `app.json`, so the marketing
version has to be edited there by hand.

## Splash screen

Two traps here, both of which produce a launch screen that looks broken while
`app.json` reads as correct.

**Expo will not generate a valid storyboard without an `image`.** Configuring
only a `backgroundColor` — whether through the legacy top-level `splash` key or
the `expo-splash-screen` plugin — emits a `SplashScreen.storyboard` whose view
is `systemBackgroundColor` (plain white, *not* your colour), with two
constraints pointing at an `EXPO-SplashScreen` view that was never created and a
`<resources>` entry for a `SplashScreenLogo` imageset that does not exist. The
background colorset is written to `Images.xcassets` and then never referenced.

**`image` is a centred ~100pt logo, not a full-bleed background.** The storyboard
pins it to a fixed square frame, so `resizeMode` only governs how it fills that
square. A non-square source is letterboxed into it **with black padding** — which
is how a tall solid-colour asset still ends up drawing a black box on screen.

So the source image must be square. `assets/splash.png` is deliberately a solid
`#F5F3EF` square — the same value as `colors.background` — so the "logo" is
invisible against the background and the launch screen is a single flat colour
that the home screen then materialises on top of. Swap in real artwork and it
drops straight into the same slot.

Verify after any change by generating the native project and reading what it
actually produced — the config alone will not tell you:

```
npx expo prebuild --platform ios --no-install --clean
grep -c 'id="EXPO-SplashScreen"' ios/*/SplashScreen.storyboard   # must be 1
grep -o 'backgroundColor" name="[^"]*"' ios/*/SplashScreen.storyboard
rm -rf ios
```

`prebuild` also rewrites the `ios`/`android` npm scripts to `expo run:*`. This
project is managed; put them back to `expo start --ios` / `--android`.
