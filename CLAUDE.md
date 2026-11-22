@AGENTS.md

# super fair odds

A collection of tactile randomizers for iOS. Minimal, premium, Apple-like
utility — the objects (coin, dice, cards, wheel) carry the personality, not the
chrome.

Five activities, all shipping: **Flip a Coin**, **Roll Dice**, **Draw a Card**,
**Spin a Wheel**, and **Pick a Number**. No placeholders remain.

Two tabs: Home and History. There is no Settings tab.

No backend. No auth. 100% local.

## Stack
- Expo SDK 54, React Native, TypeScript (see `AGENTS.md` for load-bearing pins)
- `react-native-reanimated` v4 for animation
- `react-native-gesture-handler` for gestures
- `react-native-svg` for the wheel's slices
- `@react-native-async-storage/async-storage` for persisted wheel options
- `@react-navigation/native-stack` + `bottom-tabs` for navigation
- `expo-haptics` for haptics
- `expo-symbols` for SF Symbols

## Layout
```
navigation/    RootNavigator (stack over tabs), FloatingTabBar
theme/         colors, spacing, radius, shadows, typography, motion
components/    shared UI — ActivityCard, PrimaryButton, ResultCard,
               SegmentedControl, NavigationHeader, Screen, ActivityScreen
data/          activities.ts — the home grid is data-driven from here
features/      one directory per activity, plus history and settings
services/      random.ts, storage.ts
```

Activity screens take an `onBack` callback rather than reaching for the
navigator, so they stay independently testable. Adding a real activity means
filling in its feature directory — Home never changes.

## Critical decisions
- **Outcome and animation are separate.** `useCoinFlip` decides *what* the coin
  lands on and hands that side to `Coin.flip()`. The animation never inspects
  where the outcome came from. Keep it that way.
- Pre-selected outcomes live in `useRequestedEnd` as a `useRef` — never
  `useState`. A re-render would be a visual tell. See **Hidden outcomes**.
- Results are published only from `Coin`'s landing callback, never earlier.
- Face swap happens at `scaleX === 0` only — verify in slow motion on device.
- Easing curves are built inside `flip()`, never at module scope (module-scope
  `Easing.bezier` crashes the worklet runtime at startup).
- Design tokens live in `theme/` — no magic colors, spacings, or radii in
  component files.
- Home art is data-driven via `activities.ts`. Swapping an SF Symbol placeholder
  for real artwork is a one-line change there and touches no layout code.

## Hidden outcomes

Every activity can be rigged. Two invisible touch targets sit in the lower
corners of the hero stage: **left is the low end of what the activity can do,
right is the high end.** One gesture, five meanings, so it is learned once.

| Activity | Left | Right |
| --- | --- | --- |
| Coin | Heads | Tails |
| Dice | All ones | All sixes |
| Cards | Red | Black |
| Wheel | First option | Last option |
| Numbers | Minimum | Maximum |

`components/HiddenOutcomeZones.tsx` is the surface and
`components/useRequestedEnd.ts` the state. An activity's hook takes
`RequestedEndOptions` as its second argument and calls `peekRequestedEnd()` at
the single point where it decides an outcome — the same place `randomInt` used
to be called, never anywhere else. Grep for "The one place a pre-selected
outcome is allowed to influence anything"; there are five.

Rules that are load-bearing, not stylistic:

- **The selection is a `useRef`.** A re-render is a visual tell. Nothing about
  it may reach the UI, the result copy, the history detail, or the
  accessibility tree.
- **Feedback is haptic only** — one pulse for the low end, two for the high
  end, a success notification when a repeat tap clears it.
- **The zones render FIRST, before `HeroStage`.** Later siblings take the
  touch, so the hero always wins its own area and a zone only ever collects
  taps on space the hero does not occupy. Ordering it last looks identical —
  these draw nothing — and silently arms a cheat when someone taps the hero.
  Do not "fix" the order to match reading order.

  There is no arrangement that keeps the corners clear instead: a 76×76 corner
  of the stage overlaps the wheel's rim on every phone, and a number disc on
  everything narrower than a Pro Max. Overlap is the normal case; ordering is
  what makes it harmless.

- **A stage that hugs its hero owes the zones a band.** Ordering guarantees
  correctness, not a target: where the hero fills the box there is nothing left
  to tap. The wheel and number picker therefore carry `paddingBottom:
  spacing.xxl` instead of symmetric padding, which buys a 76×32 strip under the
  hero at every width. The coin, dice and card stages are `flex: 1` and have
  room to spare. Both screens also wrap `HeroStage` in a plain `View` so the
  zones have a box to fill.
- **The ends are ends, not specific outcomes.** Red/black rather than a named
  card, min/max rather than a number, first/last rather than a slice — so the
  gesture means the same thing at 1–10 as at 1–9999, and on any wheel whatever
  is written on it.
- **A request that cannot be served is dropped, never queued.** The card deck
  depletes, so a colour can run out; the draw falls back to the top card rather
  than dead-ending.
- The hook is per-screen. Leaving an activity unmounts it, so a rig never
  follows you to another activity or survives a back-and-return.

**A rigged series is scripted, not forced round by round.** Winning every
individual round of a best-of-three ends it 2–0 every single time, and a
best-of-three that is never 2–1 is a tell you can read from across the table.
`scriptSeries` instead draws the whole series up front — `WW` half the time,
`WLW` and `LWW` a quarter each — which is exactly the shape an honest series
takes once you know who won it (`WW` is 1/4 of all series, `WLW` and `LWW` 1/8
apiece; condition on the winner and they normalise to 1/2, 1/4, 1/4). The
requested side still always wins; it now sometimes drops a round on the way.

Drawing it once is also how the rest of `useCoinFlip` thinks about a series —
one outcome, not three — so a request changed mid-series does not reroute one
already in flight. The script is a ref, for the same reason the request is.

## 3D in React Native (the dice)

RN 0.81 has three limits that together rule out the obvious way to build a cube:

1. no `translateZ` shorthand — only a full 16-value `matrix`
2. `matrix` may not appear alongside other transform keys in the same list
3. **no `transformStyle: preserve-3d`** — a child's 3D transform is flattened
   into its parent's plane

So a die is *not* a rotating container full of offset faces; that renders flat.
Each face is a leaf view carrying one fully composed matrix:

    perspective · rotateZ · rotateX · rotateY · faceRotation · pushOut

built per frame in a worklet by `features/diceRoll/matrix.ts`. Consequences to
preserve:

- `rotateZ` must be applied OUTSIDE `rotateX`/`rotateY`, or the in-plane spin
  drags the chosen face away from the camera.
- Back faces are culled by testing the normal (`facesViewer`), not by
  `backfaceVisibility` — the matrix is ours, so the test should be too.
- Shading is derived from each face's normal, never assigned per face. Assigning
  it statically makes a die change color depending on which face is forward.
- The throw and squash stay on a 2D parent wrapper. Only leaves may be 3D.
- Faces render ~3% oversized so the cube's edges close instead of showing seams
  between rounded rectangles.

The **card flip** is the easy case and deliberately does not use `matrix.ts`:
two coplanar faces need no translateZ, so a plain `perspective + rotateY` per
leaf works. Visibility is still gated on `cos(spin)` rather than
`backfaceVisibility`, and the swap happens at 90° where the card is edge-on.

## History

`services/history.ts` is a small observable store over AsyncStorage. It is not a
plain load-on-mount hook, because results are written from activity screens and
read from a tab that is never mounted at the same time — a per-mount read would
show stale data on every visit. Subscribers share one in-memory cache that
updates the instant a result is recorded.

`recordResult` is fire-and-forget: logging a result must never delay or fail the
animation that produced it. Call it where the result is *published* (the settle
handler), never where it is generated.

One entry means one outcome the user got. A best-of-three series logs a single
"Heads wins" entry, not three flips.

Capped at 200 entries. `ActivityId` is a union, and the store additionally
validates on load that an entry's activity still exists — rows look it up
directly, so an entry stranded by a removed activity would otherwise crash the
whole tab.

Removing an activity means touching: `data/activities.ts` (entry + `ActivityId`),
`navigation/types.ts`, `RootNavigator`, its `features/` directory, and its
`accents` entry in `theme/colors.ts` if nothing else uses it.

## Motion vocabulary

All easing lives in `theme/motion.ts` as `EASING` — bezier *control points*, not
`Easing` objects, because building those at module scope crashes the worklet
runtime. Spread them at call time: `Easing.bezier(...EASING.out)`. Do not
hand-tune a new curve inside a feature; the five activities previously each had
their own near-identical variants and had begun to drift.

`EASING.gravity` is the one legitimate ease-in in the app: a falling object
accelerates. Never use it for a UI entrance — those are `EASING.out`.

Every hero object is wrapped in `HeroStage`, which owns tap-or-flick composition
and dips the object on **touch-down** rather than on release. Activities should
never hand-roll their own `Gesture.Tap`/`Gesture.Pan` pair.

`HeroStage` is also the hero's single accessibility element — it carries
`accessible` alongside its role and label, so the object is one button. Without
that prop the role and label sit on a view VoiceOver never stops at, and
whatever the hero draws is read loose instead. Heroes that render text (the
number cluster) must therefore hide their own children from the tree.

Reduced motion is handled in the shared components (`PressableScale`,
`ResultCard`, `SegmentedControl`, `HeroStage`) as well as in each hero, and it
means *less* motion, not none: opacity and color survive, movement does not.

## Casing

Three levels, quietest first:

1. **lowercase** — chrome. Where am I (`display`, `title`) and what is this
   field (`overline`). Applied by the token, never typed.
2. **Sentence case** — everything else the app says: card titles, buttons,
   segments, chips, section headers. "Flip a coin", "Shuffle deck",
   "Best of three", "2 dice", "Custom options".
3. **Capitalized** — only where a word is a *name*: result values ("Heads",
   "Five of Hearts"), the two tabs, and anything the user typed themselves.

Title Case is not used anywhere. It is the loudest capitalization convention
there is, and beside lowercase chrome it reads as a second voice rather than
the same voice at a different volume. Sentence case sits between the two, so
the whole app sounds like one thing.

That rule lives in `theme/typography.ts` as `textTransform: 'lowercase'` on
those three tokens. **Never hand-lowercase a string to get the look.** Write
every string properly cased and let the token do it, for two reasons:

- VoiceOver reads the *string*, not the rendered transform. A literal
  `'flip a coin'` is announced lowercase; `'Flip a Coin'` is announced
  correctly and still renders lowercase.
- Casing baked into content drifts. `activities.ts` previously carried both a
  `title` and a `screenTitle` purely to hold the two casings — and nothing ever
  read `screenTitle`, so the five activity screens had hardcoded their own
  copies instead. Each screen now takes its header from
  `activityById[...].title`, so the home card and the header cannot disagree.

## Result copy

Every activity blanks its result (`title: ''`) while its object is in motion,
rather than reverting to idle copy. Word results rest on "Ready"; numeric
readouts rest on an em dash. Always supply a subtitle in every state or the
card changes height between them.

## Worklets

Any helper called from inside a worklet must itself carry `'worklet'`. An
unmarked module-scope helper throws on the UI runtime and takes the whole app
down with an opaque `SIGABRT` in `worklets::scheduleOnUI` — no JS stack. This
already cost one crash (`norm()` in the wheel's pointer-tick derived value).
Marking a function `'worklet'` does not stop the JS thread from calling it.

Related: build `Easing` curves inside the animation function, never at module
scope.

`HeroStage`'s gestures are worklets for a reason beyond performance. Under
`.runOnJS(true)` the whole gesture — including the touch-down dip that is the
component's entire purpose — was scheduled on the JS thread, which is exactly
the thread busy deciding an outcome. The feedback arrived late precisely when
it mattered. Only `onActivate` crosses back via `runOnJS`, because the outcome
is React state. Note that `fired` is therefore a shared value, not a `useRef`:
the pan handler reads it on the UI thread.

## Pick a Number

The cluster is a fixed arrangement — one hero plus up to **six** satellites —
whatever the range. When the range holds seven or fewer values the satellites
are the real other numbers; beyond that they are distinct random samples.
Anchors live in `types.ts` in units of hero diameters.

The satellites are context, not content. They say "sampled from a range"; the
hero says what you got. Nine of them at full strength said neither, because a
screen whose whole job is to show one number was showing ten. Three things keep
that hierarchy, and they are cheaper than they look:

- **Six, not nine**, at `SATELLITE_RATIO` 0.46 of the hero rather than 0.56.
- **`SATELLITE_OPACITY` on the satellite layer.** One value, because a layer's
  opacity composites fill, ink *and* shadow together — so the whole ring recedes
  in step and the hero is simply the one disc at full strength. Do not reach for
  a second muted ink color; that is this value's job.
- **Anchors ordered so every prefix is balanced**, not so the ring reads in
  order. A small range shows only the first few, and top-then-bottom-then-side
  stays centered where going around the rim would pile them on one side.

Every `Disc` is hidden from the accessibility tree. VoiceOver reads the string,
and ten loose numbers announced ahead of the control that owns them is the same
noise in another medium; the result is spoken by `HeroStage`'s label and again
by the result card.

The cluster box bounds the union of hero and satellites, so it centers the
*arrangement*, not the hero — with a lopsided prefix (a two-value range) the
hero sits a few points off-center. Deliberate: centering the hero instead would
push the ring off the gutter on a narrow phone.

Numeric fields use a number pad, which has no Return key: they commit on blur.
Tapping Pick blurs first, so `requestPick` re-derives the range from the field
text rather than trusting `range` state that has not re-rendered — and passes
that range into `cluster.pick()` so the satellites sample from the new bounds.

`SegmentedControl` accepts a `value` matching no option: the thumb hides rather
than falsely highlighting the first segment. A typed range that is not a preset
relies on this.

## Text sizing

Never spread a `typography` token into a **TextInput** style. The tokens carry a
`lineHeight` tuned to their own `fontSize`; on an iOS TextInput a lineHeight
above the font's natural leading pushes the glyphs down inside the line box, so
the text stops aligning with anything beside it (this misaligned the wheel's
option rows by 3.5pt against their color dots). Set `fontSize`/`fontWeight`/
`letterSpacing` explicitly and leave `lineHeight` unset. Plain `Text` is fine —
it centers within the line box.

Do not use `adjustsFontSizeToFit` inside a ScrollView. Its measurement collapses
the text to a few pixels and `minimumFontScale` does not bound it — `ResultCard`
hit this on the wheel screen. Use `numberOfLines` + `ellipsizeMode` instead.

## Deck model (Draw a Card)

Draws are **without replacement**. The deck depletes, the stack visibly thins,
and it reshuffles itself once exhausted; the user can also shuffle at any time.
A drawn card is retired by fading as it drops back to the deck, so the card is
never seen un-turning. Verified: no repeats within a 52-draw cycle.

## Wheel model

The wheel is exactly the options list — there is no separate segment-count
control. Options persist via AsyncStorage. Two guards matter: the save effect is
gated on a `hydrated` ref (saving before the load resolves would overwrite the
user's list with the defaults), and editing the list clears the current result
because the slices it referred to have changed.

The winner is chosen first; the wheel is told which slice to stop on and lands
at a random angle *within* it, so it never snaps to the same spot. The pointer
is a sibling that never rotates — it only flicks as dividers pass, and clicks
haptically just in the final slow phase.

## Running
```
npx expo start --ios
```
