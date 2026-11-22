# Store asset scripts

Refreshing App Store screenshots after a UI change. They went stale once
already — the casing pass and the number-picker redesign both landed after a
capture — so the point of these is that redoing them is cheap.

## 1. Capture the raw screens

Boot the simulator, run the app, and fix the status bar first, or the shots
will disagree with each other:

```bash
xcrun simctl status_bar <udid> override \
  --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 \
  --cellularMode active --cellularBars 4 --batteryState discharging --batteryLevel 100
```

Set this **before** the first capture. A shot taken beforehand shows a green
charging battery while the rest show a plain one, which is invisible until you
put them side by side.

Capture each screen to `store-screenshots/` as `01-home` … `07-history`:

```bash
xcrun simctl io <udid> screenshot store-screenshots/01-home.png
```

Pass the device UDID explicitly. Plain `booted` picks the first booted device,
which may be an Apple TV, and you get a 3840×2160 TV frame instead.

An iPhone 17 Pro Max captures at exactly 1320×2868, the required 6.9" size.

Screenshots come out RGBA. **Flatten them** — App Store Connect rejects any
image with an alpha channel.

## 2. Build the marketing shots

```bash
python3 scripts/make-marketing-screenshots.py store-screenshots store-screenshots/marketing
```

Headline over a framed device shot, one per activity. Headlines and subtitles
live in `PANELS` near the bottom of that file.

## 3. Derive the 6.5" set

```bash
python3 scripts/make-65-inch.py store-screenshots/marketing store-screenshots/marketing/6.5-inch
```

6.9" and 6.5" are not the same aspect ratio, so a straight resize squashes
everything 0.4% vertically. This scales by height and pads the leftover columns
by replicating the edge, which is invisible because the panels carry only
background at their edges.

The 6.5" set is optional — Apple scales the 6.9" set down — but the live
listing already has one, so it needs replacing or deleting.

## What goes to App Store Connect

`store-screenshots/marketing/`, not the raw captures. The raw ones are source
material for step 2.
