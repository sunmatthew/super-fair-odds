import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CardBack, CARD_ASPECT } from './CardArt';
import { DECK_SIZE } from './types';

interface CardStackProps {
  width: number;
  /** Cards still in the deck; the stack visibly thins as it is drawn down. */
  remaining: number;
}

const MAX_LAYERS = 4;

/**
 * The undrawn deck, sitting under the card being drawn. These are the layers
 * *behind* the top card — the top of the deck is the `Card` itself, which is
 * why it can lift straight off the stack.
 */
export function CardStack({ width, remaining }: CardStackProps) {
  const layers = Math.min(
    MAX_LAYERS,
    Math.max(0, Math.ceil((remaining - 1) / (DECK_SIZE / MAX_LAYERS)))
  );

  return (
    <View
      style={[styles.root, { width, height: width / CARD_ASPECT }]}
      pointerEvents="none"
    >
      {/* Deepest first, so the shallowest sits nearest the drawn card. */}
      {Array.from({ length: layers }, (_, i) => layers - i).map((depth) => (
        <View
          key={depth}
          style={[
            styles.layer,
            {
              transform: [
                { translateY: depth * 2.5 },
                { translateX: depth * 1.5 },
              ],
              opacity: 1 - depth * 0.06,
            },
          ]}
        >
          <CardBack width={width} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
