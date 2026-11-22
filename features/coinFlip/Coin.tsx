import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Side } from './types';
import { EASING } from '../../theme';

export interface CoinHandle {
  /** Runs the flip and guarantees the coin settles on `result`. */
  flip: (result: Side) => void;
  isFlipping: () => boolean;
}

interface CoinProps {
  size?: number;
  /** Peak height of the toss, in points above rest. */
  apex?: number;
  duration?: number;
  /** Fires once the coin has physically settled — never before. */
  onSettled?: (result: Side) => void;
  disabled?: boolean;
}

const DEFAULT_APEX = 260;

const FACES = {
  heads: {
    fill: '#E5B845',
    border: '#C08D22',
    glow: '#F2D488',
    ripple: '#E8C165',
    label: '#A97A1455',
    highlight: 'rgba(255,255,255,0.10)',
  },
  tails: {
    fill: '#CFCBC2',
    border: '#A9A49A',
    glow: '#DEDAD2',
    ripple: '#C4BFB5',
    label: '#6F6A6055',
    highlight: 'rgba(255,255,255,0.14)',
  },
} as const;

/**
 * The coin. Purely a renderer with an imperative handle — it is told which
 * side to land on and never decides the outcome itself.
 *
 * Choreography (at the default 1350ms):
 *   0ms      press dips the coin
 *   0-648    ascent on an ease-out arc
 *   130-1085 four scaleX collapses; the face is swapped only at scaleX === 0
 *   648-1350 descent on an ease-in arc
 *   1350     landing: bounce, squash/stretch, glow, ripple, heavy haptic
 *
 * The first three collapses toggle the visible face for the spin illusion; the
 * fourth sets the real result, ~365ms before the coin lands.
 */
export const Coin = forwardRef<CoinHandle, CoinProps>(function Coin(
  {
    size = 190,
    apex = DEFAULT_APEX,
    duration = 1350,
    onSettled,
    disabled = false,
  },
  ref
) {
  const translateY = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const wobbleX = useSharedValue(0); // subtle 3D tilt during flight
  const pressScale = useSharedValue(1);
  const squashY = useSharedValue(1);
  const squashX = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const shineOpacity = useSharedValue(0);

  // Result lives in a shared value so the landing worklet can read it safely.
  const resultSV = useSharedValue<number>(0); // 0 = heads, 1 = tails
  const apexSV = useSharedValue(apex);

  const [visibleFace, setVisibleFace] = useState<Side>('heads');
  const isFlippingRef = useRef(false);
  const apexRef = useRef(apex);
  apexRef.current = apex;

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    apexSV.value = apex;
  }, [apex, apexSV]);

  const toggleFace = useCallback(() => {
    setVisibleFace((f) => (f === 'heads' ? 'tails' : 'heads'));
  }, []);

  const setFace = useCallback((face: Side) => {
    setVisibleFace(face);
  }, []);

  const fireHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const handleComplete = useCallback(() => {
    isFlippingRef.current = false;
    onSettled?.(resultSV.value === 0 ? 'heads' : 'tails');
  }, [onSettled, resultSV]);

  const flip = useCallback(
    (result: Side) => {
      if (isFlippingRef.current || disabled) return;
      isFlippingRef.current = true;
      resultSV.value = result === 'heads' ? 0 : 1;

      // Spread at call time — never at module scope (worklet runtime crash).
      const easeOut = Easing.bezier(...EASING.out);
      const easeIn = Easing.bezier(...EASING.gravity);
      const easeBounce = Easing.bezier(...EASING.bounceStrong);

      // With Reduce Motion on, skip the toss entirely and settle in place.
      if (reduceMotion) {
        setFace(result);
        pressScale.value = withSequence(
          withTiming(0.94, { duration: 90, easing: easeOut }),
          withTiming(1, { duration: 140, easing: easeBounce }, (finished) => {
            'worklet';
            if (!finished) return;
            runOnJS(fireHaptic)();
            runOnJS(handleComplete)();
          })
        );
        return;
      }

      const peak = -apexRef.current;
      const launch = Math.round(duration * 0.48); // ascending
      const fall = duration - launch; // descending

      // ── Press down ──────────────────────────────────────────────
      pressScale.value = withTiming(0.93, { duration: 100, easing: easeOut });

      // ── Shine sweep during flight ────────────────────────────────
      shineOpacity.value = withSequence(
        withTiming(0.7, { duration: 200 }),
        withTiming(0.25, { duration: launch + fall - 400 }),
        withTiming(0, { duration: 200 })
      );

      // ── Vertical arc ─────────────────────────────────────────────
      translateY.value = withSequence(
        withTiming(peak, { duration: launch, easing: easeOut }),
        withTiming(0, { duration: fall, easing: easeIn }, (finished) => {
          'worklet';
          if (!finished) return;

          // Landing bounce
          translateY.value = withSequence(
            withTiming(-22, { duration: 75, easing: easeOut }),
            withTiming(0, { duration: 130, easing: easeBounce })
          );

          // Squash/stretch
          squashY.value = withSequence(
            withTiming(0.8, { duration: 75, easing: easeOut }),
            withTiming(1.08, { duration: 75, easing: easeBounce }),
            withTiming(1, { duration: 130, easing: easeBounce })
          );
          squashX.value = withSequence(
            withTiming(1.18, { duration: 75, easing: easeOut }),
            withTiming(0.96, { duration: 75, easing: easeBounce }),
            withTiming(1, { duration: 130, easing: easeBounce })
          );

          // Glow flash
          glowOpacity.value = withSequence(
            withTiming(1, { duration: 55 }),
            withTiming(0, { duration: 420 })
          );

          // Impact ripple
          rippleScale.value = withTiming(3.8, { duration: 600, easing: easeOut });
          rippleOpacity.value = withSequence(
            withTiming(0.65, { duration: 40 }),
            withTiming(0, { duration: 560, easing: easeOut })
          );

          // Snap press scale back
          pressScale.value = withTiming(1, { duration: 200, easing: easeBounce });

          runOnJS(fireHaptic)();
          runOnJS(handleComplete)();
        })
      );

      // ── Subtle 3D wobble (X tilt) during flight ──────────────────
      wobbleX.value = withSequence(
        withTiming(14, { duration: Math.round(launch * 0.45), easing: easeOut }),
        withTiming(-9, { duration: Math.round(launch * 0.55), easing: easeOut }),
        withTiming(6, { duration: Math.round(fall * 0.5), easing: easeIn }),
        withTiming(0, { duration: Math.round(fall * 0.5), easing: easeIn })
      );

      // ── scaleX spin cycles (face swap mechanic) ───────────────────
      //
      // Three visual toggle-collapses during ascent, then one deterministic
      // setFace(result) collapse during descent. The toggles only sell the
      // spin; the final collapse is what makes the outcome true, so the
      // starting face never matters.
      //
      // Collapse timings are chosen to land near the wobbleX crossings for a
      // coherent 3D feel.

      const C = 95; // collapse duration ms
      const E = 115; // expand duration ms

      scaleX.value = withSequence(
        // initial hold (let press settle)
        withTiming(1, { duration: 130 }),

        // cycle 1 – toggle face
        withTiming(0, { duration: C }, (f) => {
          'worklet';
          if (f) runOnJS(toggleFace)();
        }),
        withTiming(1, { duration: E }),

        // cycle 2 – toggle face
        withTiming(0, { duration: C }, (f) => {
          'worklet';
          if (f) runOnJS(toggleFace)();
        }),
        withTiming(1, { duration: E }),

        // cycle 3 – toggle face (coin near apex)
        withTiming(0, { duration: C }, (f) => {
          'worklet';
          if (f) runOnJS(toggleFace)();
        }),
        withTiming(1, { duration: E }),

        // hold mid-fall
        withTiming(1, { duration: 130 }),

        // final collapse → deterministic reveal
        withTiming(0, { duration: C }, (f) => {
          'worklet';
          if (f) runOnJS(setFace)(resultSV.value === 0 ? 'heads' : 'tails');
        }),
        withTiming(1, { duration: 140 })
        // coin holds the result face until landing (remaining ~200ms)
      );
    },
    [
      disabled,
      duration,
      reduceMotion,
      resultSV,
      translateY,
      scaleX,
      wobbleX,
      pressScale,
      squashY,
      squashX,
      glowOpacity,
      rippleScale,
      rippleOpacity,
      shineOpacity,
      toggleFace,
      setFace,
      fireHaptic,
      handleComplete,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({ flip, isFlipping: () => isFlippingRef.current }),
    [flip]
  );

  // ── Animated styles ────────────────────────────────────────────────

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { perspective: 900 },
      { rotateX: `${wobbleX.value}deg` },
      { scaleX: scaleX.value * squashX.value },
      { scaleY: squashY.value },
      { scale: pressScale.value },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => {
    const t = interpolate(
      Math.abs(translateY.value),
      [0, Math.max(apexSV.value, 1)],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: interpolate(t, [0, 1], [0.12, 0.02], Extrapolation.CLAMP),
      transform: [
        { scaleX: interpolate(t, [0, 1], [1, 0.35], Extrapolation.CLAMP) },
        { scaleY: interpolate(t, [0, 1], [1, 0.35], Extrapolation.CLAMP) },
      ],
    };
  });

  // Halo is mapped down rather than retimed, so the landing beat is unchanged.
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.value, [0, 1], [0, 0.5], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(glowOpacity.value, [0, 1], [0.85, 1.35], Extrapolation.CLAMP) },
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: shineOpacity.value,
  }));

  const face = FACES[visibleFace];
  const half = size / 2;

  return (
    <View style={styles.wrapper}>
      {/* Ground shadow */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadow,
          { width: size * 0.72, height: size * 0.08, borderRadius: size * 0.5 },
          shadowStyle,
        ]}
      />

      {/* Glow halo behind coin */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.absoluteCenter,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: face.glow,
          },
          glowStyle,
        ]}
      />

      {/* Impact ripple ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.absoluteCenter,
          {
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: 2,
            borderColor: face.ripple,
          },
          rippleStyle,
        ]}
      />

      {/* Coin */}
      <Animated.View style={coinStyle}>
        <View
          style={[
            styles.coin,
            {
              width: size,
              height: size,
              borderRadius: half,
              backgroundColor: face.fill,
              borderColor: face.border,
            },
          ]}
        >
          {/* Edge depth ring */}
          <View
            style={[
              styles.innerRing,
              {
                width: size * 0.8,
                height: size * 0.8,
                borderRadius: size * 0.4,
                borderColor: face.border,
              },
            ]}
          >
            <Text
              style={[styles.label, { fontSize: size * 0.4, color: face.label }]}
              allowFontScaling={false}
            >
              {visibleFace === 'heads' ? 'H' : 'T'}
            </Text>
          </View>

          {/* Static top-left highlight (simulates light source) */}
          <View
            style={[
              styles.staticHighlight,
              {
                width: size * 0.55,
                height: size * 0.3,
                borderRadius: size * 0.4,
                top: size * 0.06,
                left: size * 0.08,
                backgroundColor: face.highlight,
              },
            ]}
          />

          {/* Animated specular shine (sweeps during spin) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shine,
              {
                width: size * 0.42,
                height: size * 0.42,
                borderRadius: size * 0.21,
                top: size * 0.05,
                left: size * 0.07,
              },
              shineStyle,
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#1A1917',
    alignSelf: 'center',
  },
  absoluteCenter: {
    position: 'absolute',
  },
  coin: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    // Raised edge shadow
    shadowColor: '#1A1917',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  innerRing: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '900',
    letterSpacing: -2,
  },
  staticHighlight: {
    position: 'absolute',
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
