import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { CardBack, CardFace, CARD_ASPECT } from './CardArt';
import { PlayingCard } from './types';
import { EASING } from '../../theme';

export interface CardHandle {
  /** Lifts the top card off the deck and turns it face up. */
  reveal: (card: PlayingCard) => void;
  /** Returns the card to the deck, face down. */
  reset: () => void;
  isBusy: () => boolean;
}

interface CardProps {
  width: number;
  /** How far above the deck a revealed card comes to rest. */
  lift: number;
  /** Fires once the card is face up and settled — never before. */
  onRevealed?: () => void;
}

/**
 * The top card of the deck. At rest it is a back, flush with the stack, which
 * is what lets it lift straight off.
 *
 * Two coplanar faces, each a leaf with its own `perspective + rotateY`. Unlike
 * the die this needs no translateZ, so RN's lack of preserve-3d is irrelevant
 * here — but visibility is still gated on the rotation rather than trusted to
 * `backfaceVisibility`.
 *
 *   spin   0° → back to camera        180° → face to camera
 *   swap happens at 90°, where the card is edge-on and the change is unseen.
 */
export const Card = forwardRef<CardHandle, CardProps>(function Card(
  { width, lift, onRevealed },
  ref
) {
  const spin = useSharedValue(0);
  const rise = useSharedValue(0);
  const scale = useSharedValue(0.96);
  const tilt = useSharedValue(0);
  const opacity = useSharedValue(1);

  const [face, setFace] = useState<PlayingCard | null>(null);

  const busy = useRef(false);
  const revealed = useRef(false);
  const pending = useRef<PlayingCard | null>(null);
  const liftRef = useRef(lift);
  liftRef.current = lift;

  const reduceMotion = useReducedMotion();

  const fireHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const finish = useCallback(() => {
    busy.current = false;
    onRevealed?.();
  }, [onRevealed]);

  const beginReveal = useCallback(() => {
    const card = pending.current;
    if (!card) {
      busy.current = false;
      return;
    }

    // Build easings here, never at module scope.
    const easeOut = Easing.bezier(...EASING.out);
    const easeBounce = Easing.bezier(...EASING.bounce);
    // A turn is a morph, not an entrance: both ends should ease.
    const flipEase = Easing.bezier(...EASING.inOut);

    setFace(card);
    revealed.current = true;

    // Snap back to a face-down card on the deck before lifting again.
    spin.value = 0;
    rise.value = 0;
    tilt.value = 0;
    scale.value = 0.96;
    opacity.value = withTiming(1, { duration: 110 });

    if (reduceMotion) {
      spin.value = withTiming(180, { duration: 180 }, (finished) => {
        'worklet';
        if (!finished) return;
        runOnJS(fireHaptic)();
        runOnJS(finish)();
      });
      rise.value = withTiming(-liftRef.current, { duration: 180 });
      scale.value = withTiming(1, { duration: 180 });
      return;
    }

    const target = -liftRef.current;

    rise.value = withSequence(
      withTiming(target * 1.06, { duration: 300, easing: easeOut }),
      withTiming(target, { duration: 220, easing: easeBounce })
    );
    scale.value = withSequence(
      withTiming(1.05, { duration: 300, easing: easeOut }),
      withTiming(1, { duration: 220, easing: easeBounce })
    );
    tilt.value = withSequence(
      withTiming(-3.5, { duration: 290, easing: easeOut }),
      withTiming(1.5, { duration: 190 }),
      withTiming(0, { duration: 200, easing: easeBounce })
    );

    // The turn starts just after the card clears the deck.
    spin.value = withDelay(
      90,
      withTiming(180, { duration: 430, easing: flipEase }, (finished) => {
        'worklet';
        if (!finished) return;
        runOnJS(fireHaptic)();
        runOnJS(finish)();
      })
    );
  }, [fireHaptic, finish, opacity, reduceMotion, rise, scale, spin, tilt]);

  const reveal = useCallback(
    (card: PlayingCard) => {
      if (busy.current) return;
      busy.current = true;
      pending.current = card;

      if (!revealed.current) {
        beginReveal();
        return;
      }

      // Retire the card already showing: drop it back to the deck while fading,
      // so the un-turning is never seen.
      opacity.value = withTiming(0, { duration: 150 });
      rise.value = withTiming(0, { duration: 150 }, (finished) => {
        'worklet';
        if (!finished) return;
        runOnJS(beginReveal)();
      });
    },
    [beginReveal, opacity, rise]
  );

  const restore = useCallback(() => {
    setFace(null);
    spin.value = 0;
    rise.value = 0;
    tilt.value = 0;
    scale.value = 0.96;
    opacity.value = withTiming(1, { duration: 160 });
    busy.current = false;
  }, [opacity, rise, scale, spin, tilt]);

  const reset = useCallback(() => {
    if (!revealed.current) return;
    revealed.current = false;
    busy.current = true;
    opacity.value = withTiming(0, { duration: 140 }, (finished) => {
      'worklet';
      if (!finished) return;
      runOnJS(restore)();
    });
  }, [opacity, restore]);

  useImperativeHandle(ref, () => ({ reveal, reset, isBusy: () => busy.current }), [
    reveal,
    reset,
  ]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: rise.value },
      { rotateZ: `${tilt.value}deg` },
      { scale: scale.value },
    ],
  }));

  const backStyle = useAnimatedStyle(() => {
    const facing = Math.cos((spin.value * Math.PI) / 180);
    return {
      opacity: facing > 0 ? 1 : 0,
      transform: [
        { perspective: width * 7 },
        { rotateY: `${spin.value}deg` },
      ],
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const facing = Math.cos((spin.value * Math.PI) / 180);
    return {
      opacity: facing < 0 ? 1 : 0,
      transform: [
        { perspective: width * 7 },
        { rotateY: `${spin.value + 180}deg` },
      ],
    };
  });

  const height = width / CARD_ASPECT;

  return (
    <Animated.View
      style={[styles.root, { width, height }, containerStyle]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.faceLayer, backStyle]}>
        <CardBack width={width} />
      </Animated.View>

      <Animated.View style={[styles.faceLayer, frontStyle]}>
        {face ? <CardFace card={face} width={width} /> : <View />}
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    shadowColor: '#1A1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  faceLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
