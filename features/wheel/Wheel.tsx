import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { segmentColor, WHEEL_GOLD } from './types';
import { EASING } from '../../theme';

export interface WheelHandle {
  /** Spins and guarantees the pointer settles inside segment `index`. */
  spin: (index: number) => void;
  isSpinning: () => boolean;
}

interface WheelProps {
  size: number;
  /** Number of slices; must match the options list. */
  count: number;
  onSettled?: () => void;
}

const SPIN_MS = 2600;
const SETTLE_MS = 260;
const MIN_TURNS = 4;
const EXTRA_TURNS = 3;
/** How close to the finish the pointer starts clicking audibly. */
const TICK_WINDOW_DEG = 150;

/**
 * Marked as a worklet because the pointer-tick derived value calls it on the
 * UI runtime; an unmarked helper throws there and takes the app down.
 * Still callable from the JS thread, which `spin` does.
 */
function norm(deg: number): number {
  'worklet';
  return ((deg % 360) + 360) % 360;
}

/** Wedge from `startDeg` to `endDeg`, measured clockwise from twelve o'clock. */
function segmentPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = point(startDeg);
  const [x2, y2] = point(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/**
 * The wheel. Told which segment to land on, it spins several turns and
 * decelerates into an angle inside that slice.
 *
 * The whole SVG is static; only its container rotates, so nothing re-renders
 * during the spin. The pointer is a sibling that never rotates with the wheel
 * — it only flicks, hinged at its tip, each time a divider passes under it.
 */
export const Wheel = forwardRef<WheelHandle, WheelProps>(function Wheel(
  { size, count, onSettled },
  ref
) {
  const rotation = useSharedValue(0);
  const pointerKick = useSharedValue(0);
  const lastSegment = useSharedValue(-1);
  const finalAngle = useSharedValue(0);
  const segments = useSharedValue(count);

  const busy = useRef(false);
  const countRef = useRef(count);
  countRef.current = count;

  const reduceMotion = useReducedMotion();

  const radius = size / 2;
  const rimWidth = size * 0.052;
  const faceRadius = radius - rimWidth;
  const hubSize = size * 0.17;

  const paths = useMemo(() => {
    if (count <= 0) return [];
    const step = 360 / count;
    return Array.from({ length: count }, (_, i) => ({
      d: segmentPath(radius, radius, faceRadius, i * step, (i + 1) * step),
      fill: segmentColor(i),
    }));
  }, [count, faceRadius, radius]);

  const tick = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const land = useCallback(() => {
    busy.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSettled?.();
  }, [onSettled]);

  // Flick the pointer whenever a divider passes beneath it, and click only
  // once the wheel has slowed — ticking all ~40 crossings would be noise.
  useDerivedValue(() => {
    const n = segments.value;
    if (n <= 0) return 0;

    const step = 360 / n;
    const index = Math.floor(norm(-rotation.value) / step);

    if (index === lastSegment.value) return index;

    const first = lastSegment.value === -1;
    lastSegment.value = index;
    if (first) return index;

    pointerKick.value = withSequence(
      withTiming(-11, { duration: 45 }),
      withTiming(0, { duration: 115 })
    );

    const remaining = finalAngle.value - rotation.value;
    if (remaining > 0 && remaining < TICK_WINDOW_DEG) {
      runOnJS(tick)();
    }
    return index;
  });

  const spin = useCallback(
    (index: number) => {
      if (busy.current) return;
      busy.current = true;

      const n = countRef.current;
      if (n <= 0) {
        busy.current = false;
        return;
      }

      // Built here, never at module scope.
      const spinEase = Easing.bezier(...EASING.spinDown);
      const settleEase = Easing.bezier(...EASING.settle);

      const step = 360 / n;
      // Land anywhere in the slice but clear of its edges, so it never looks
      // like the wheel snaps to the same spot every time.
      const within = step * (0.22 + Math.random() * 0.56);
      const targetRotation = norm(-(index * step + within));

      const start = norm(rotation.value);
      rotation.value = start;

      const turns = MIN_TURNS + Math.floor(Math.random() * EXTRA_TURNS);
      const final = start + norm(targetRotation - start) + turns * 360;
      finalAngle.value = final;

      if (reduceMotion) {
        rotation.value = withTiming(final, { duration: 280 }, (finished) => {
          'worklet';
          if (!finished) return;
          runOnJS(land)();
        });
        return;
      }

      rotation.value = withSequence(
        // Slight overshoot, then the pointer pushes it back — how a real wheel
        // settles against the last peg.
        withTiming(final + 3.5, { duration: SPIN_MS, easing: spinEase }),
        withTiming(final, { duration: SETTLE_MS, easing: settleEase }, (finished) => {
          'worklet';
          if (!finished) return;
          runOnJS(land)();
        })
      );
    },
    [finalAngle, land, reduceMotion, rotation]
  );

  // Mirrored into a shared value via an effect, not during render — writing a
  // shared value while React renders is unsafe and Reanimated warns about it.
  useEffect(() => {
    segments.value = count;
  }, [count, segments]);

  // At rest, park a slice under the pointer rather than a divider, which would
  // read as ambiguous. Re-parks when the slice count changes.
  useEffect(() => {
    if (busy.current || count <= 0) return;
    rotation.value = norm(-(360 / count) / 2);
    lastSegment.value = -1;
  }, [count, lastSegment, rotation]);

  useImperativeHandle(ref, () => ({ spin, isSpinning: () => busy.current }), [spin]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pointerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${pointerKick.value}deg` }],
  }));

  const pointerWidth = size * 0.1;
  const pointerHeight = size * 0.17;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Animated.View style={wheelStyle}>
        <Svg width={size} height={size}>
          {/* Rim */}
          <Circle cx={radius} cy={radius} r={radius} fill={WHEEL_GOLD.rim} />
          <Circle
            cx={radius}
            cy={radius}
            r={radius - rimWidth * 0.35}
            fill={WHEEL_GOLD.rimInner}
          />
          {/* Slices */}
          {paths.map((p, i) => (
            <Path key={i} d={p.d} fill={p.fill} />
          ))}
          {/* Inner edge of the rim, over the slice corners */}
          <Circle
            cx={radius}
            cy={radius}
            r={faceRadius}
            fill="none"
            stroke={WHEEL_GOLD.rimEdge}
            strokeWidth={size * 0.012}
          />
        </Svg>
      </Animated.View>

      {/* Hub — radially symmetric, so it has no reason to turn. */}
      <View
        style={[
          styles.hub,
          {
            width: hubSize,
            height: hubSize,
            borderRadius: hubSize / 2,
            backgroundColor: WHEEL_GOLD.hub,
            borderColor: WHEEL_GOLD.hubEdge,
          },
        ]}
        pointerEvents="none"
      />

      {/* Pointer — hinged at its top so the flick reads as a hinge, not a slide. */}
      <Animated.View
        style={[
          styles.pointer,
          {
            width: pointerWidth,
            height: pointerHeight,
            top: -pointerHeight * 0.34,
            transformOrigin: 'top center',
          },
          pointerStyle,
        ]}
        pointerEvents="none"
      >
        <Svg width={pointerWidth} height={pointerHeight}>
          <Circle
            cx={pointerWidth / 2}
            cy={pointerWidth / 2}
            r={pointerWidth / 2}
            fill={WHEEL_GOLD.pointer}
          />
          <Polygon
            points={`0,${pointerWidth / 2} ${pointerWidth},${pointerWidth / 2} ${pointerWidth / 2},${pointerHeight}`}
            fill={WHEEL_GOLD.pointer}
          />
          <Circle
            cx={pointerWidth / 2}
            cy={pointerWidth / 2}
            r={pointerWidth * 0.17}
            fill={WHEEL_GOLD.pointerEdge}
          />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hub: {
    position: 'absolute',
    borderWidth: 2,
    shadowColor: '#1A1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  pointer: {
    position: 'absolute',
    alignSelf: 'center',
    shadowColor: '#1A1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
