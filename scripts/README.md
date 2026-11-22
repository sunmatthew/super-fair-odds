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
live in `PANELS`; sizes live in `SIZES`.

This writes one folder per canvas size — `1320x2868/`, `1206x2622/` and so on —
each rendered natively rather than resampled from one master, so the headline
is re-laid out per canvas and the type stays crisp. Add a size to `SIZES` and
it just works; the geometry scales from `BASE_H`.

## Which size App Store Connect wants

**You cannot tell from the slot's name.** The upload panel states its accepted
sizes, and they do not match the inch labels in any obvious way — a slot headed
"iPhone 6.1" or 6.3" displays" takes 1179×2556 or 1206×2622, while a tab
labelled "iPhone with Dynamic Island (medium display)" gives no clue at all.
Uploading the wrong one returns "File dimensions are invalid", which sounds
like a corrupt file and is not.

So: read the sizes off the panel, then drag from the folder with that name.
Rendering every size up front is cheaper than guessing.

Watch out for two other things on that screen. Promotional artwork is a
separate, optional slot that takes large **landscape** art (5244×2950,
3840×2560, 1920×1280) and will reject portrait screenshots. And the preview
sizes quoted beside the screenshot sizes (1920×886, 886×1920) are for app
preview *videos*.

## Deriving one size from another

`make-65-inch.py` scales by height and edge-pads the leftover columns, for when
you have one size and want another without re-rendering. Native rendering is
better, so this is only a fallback — but note why it pads: 6.9" and 6.5" are
not the same aspect ratio, and a straight resize squashes everything 0.4%
vertically.

## What goes to App Store Connect

A size folder under `store-screenshots/marketing/`, never the raw captures.
The raw ones are source material for step 2.
