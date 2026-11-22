import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DieFace, DIE_COLORS } from './DieFace';
import { Mat4, multiply4, rotateX4, rotateY4, translateZ4 } from './matrix';
import { DieValue, FACE_LAYOUT, FACE_ORIENTATION } from './types';
import { EASING } from '../../theme';

export interface DieHandle {
  /** Tumbles and guarantees the die settles showing `value`. */
  roll: (value: DieValue, delay?: number) => void;
  isRolling: () => boolean;
}

interface DieProps {
  size: number;
  /** Peak height of the throw, in points above rest. */
  apex?: number;
  duration?: number;
  onSettled?: () => void;
}

const norm = (deg: number) => ((deg % 360) + 360) % 360;
const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

/**
 * A real six-sided cube. Each face is a View pushed out to the cube surface by
 * a static matrix; the tumble animates the container's rotations, which RN
 * supports natively, so no matrix math runs per frame.
 *
 * Transform order matters: rotateZ must sit OUTSIDE rotateX/rotateY, otherwise
 * the in-plane spin would drag the chosen face away from the camera.
 */
export const Die = forwardRef<DieHandle, DieProps>(function Die(
  { size, apex = 150, duration = 1150, onSettled },
  ref
) {
  const translateY = useSharedValue(0);
  const rotX = useSharedValue(0);
  const rotY = useSharedValue(0);
  const rotZ = useSharedValue(0);
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);

  const isRollingRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const half = size / 2;

  // Static per-face placement; recomputed only when the die resizes.
  // Static placement of each face on the cube surface.
  const faces = useMemo<{ value: DieValue; placement: Mat4 }[]>(() => {
    const out = translateZ4(half);
    return [
      { value: FACE_LAYOUT.front, placement: out },
      { value: FACE_LAYOUT.back, placement: multiply4(rotateY4(180), out) },
      { value: FACE_LAYOUT.right, placement: multiply4(rotateY4(90), out) },
      { value: FACE_LAYOUT.left, placement: multiply4(rotateY4(-90), out) },
      { value: FACE_LAYOUT.top, placement: multiply4(rotateX4(90), out) },
      { value: FACE_LAYOUT.bottom, placement: multiply4(rotateX4(-90), out) },
    ];
  }, [half]);

  /**
   * A settled die lands square to the camera, which reads flat. This constant
   * tilt is applied outside the roll so the value stays the face you see while
   * the cube keeps its solidity.
   */
  const viewTilt = useMemo(() => multiply4(rotateX4(-16), rotateY4(-18)), []);

  const fireHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleSettled = useCallback(() => {
    isRollingRef.current = false;
    onSettled?.();
  }, [onSettled]);

  const roll = useCallback(
    (value: DieValue, delay = 0) => {
      if (isRollingRef.current) return;
      isRollingRef.current = true;

      const easeOut = Easing.bezier(...EASING.out);
      const easeIn = Easing.bezier(...EASING.gravity);
      const easeBounce = Easing.bezier(...EASING.bounce);
      // Tumbles near-steadily in the air, then decelerates hard into the table.
      const spin = Easing.bezier(...EASING.spinDown);

      if (reduceMotion) {
        const target = FACE_ORIENTATION[value];
        rotX.value = withTiming(target.x, { duration: 180 });
        rotY.value = withTiming(target.y, { duration: 180 });
        rotZ.value = withTiming(0, { duration: 180 }, (finished) => {
          'worklet';
          if (!finished) return;
          runOnJS(fireHaptic)();
          runOnJS(handleSettled)();
        });
        return;
      }

      const target = FACE_ORIENTATION[value];

      // Land exactly on the target orientation after a whole number of turns.
      const startX = norm(rotX.value);
      const startY = norm(rotY.value);
      const startZ = norm(rotZ.value);
      rotX.value = startX;
      rotY.value = startY;
      rotZ.value = startZ;

      const finalX = startX + norm(target.x - startX) + 360 * randomInt(2, 3);
      const finalY = startY + norm(target.y - startY) + 360 * randomInt(2, 3);
      // Any quarter turn leaves a settled die looking square.
      const restZ = 90 * randomInt(0, 3);
      const finalZ = startZ + norm(restZ - startZ) + 360 * randomInt(1, 2);

      const launch = Math.round(duration * 0.44);
      const fall = duration - launch;

      rotX.value = withDelay(delay, withTiming(finalX, { duration, easing: spin }));
      rotY.value = withDelay(delay, withTiming(finalY, { duration, easing: spin }));
      rotZ.value = withDelay(delay, withTiming(finalZ, { duration, easing: spin }));

      translateY.value = withDelay(
        delay,
        withSequence(
          withTiming(-apex, { duration: launch, easing: easeOut }),
          withTiming(0, { duration: fall, easing: easeIn }, (finished) => {
            'worklet';
            if (!finished) return;

            translateY.value = withSequence(
              withTiming(-apex * 0.15, { duration: 90, easing: easeOut }),
              withTiming(0, { duration: 150, easing: easeBounce })
            );
            squashY.value = withSequence(
              withTiming(0.84, { duration: 70, easing: easeOut }),
              withTiming(1.05, { duration: 80, easing: easeBounce }),
              withTiming(1, { duration: 150, easing: easeBounce })
            );
            squashX.value = withSequence(
              withTiming(1.13, { duration: 70, easing: easeOut }),
              withTiming(0.97, { duration: 80, easing: easeBounce }),
              withTiming(1, { duration: 150, easing: easeBounce })
            );

            runOnJS(fireHaptic)();
            runOnJS(handleSettled)();
          })
        )
      );
    },
    [
      apex,
      duration,
      reduceMotion,
      rotX,
      rotY,
      rotZ,
      translateY,
      squashX,
      squashY,
      fireHaptic,
      handleSettled,
    ]
  );

  useImperativeHandle(ref, () => ({ roll, isRolling: () => isRollingRef.current }), [roll]);

  const throwStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scaleX: squashX.value },
      { scaleY: squashY.value },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => {
    const t = interpolate(
      Math.abs(translateY.value),
      [0, Math.max(apex, 1)],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: interpolate(t, [0, 1], [0.11, 0.02], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(t, [0, 1], [1, 0.5], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadow,
          {
            width: size * 0.92,
            height: size * 0.1,
            borderRadius: size * 0.5,
            bottom: -size * 0.05,
          },
          shadowStyle,
        ]}
      />

      <Animated.View style={throwStyle}>
        <View style={[{ width: size, height: size }, styles.cube]}>
          {faces.map((face) => (
            <DieFace
              key={face.value}
              value={face.value as DieValue}
              size={size}
              placement={face.placement}
              rotX={rotX}
              rotY={rotY}
              rotZ={rotZ}
              perspective={size * 5}
              viewTilt={viewTilt}
            />
          ))}
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
  cube: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: DIE_COLORS.shadow,
  },
});
