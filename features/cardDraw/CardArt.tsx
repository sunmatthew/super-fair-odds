import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isRed, PlayingCard, SUIT_GLYPH } from './types';

export const CARD_ASPECT = 0.7; // width / height, standard playing-card proportions

export const CARD_COLORS = {
  face: '#FEFDFB',
  edge: '#E2DDD3',
  red: '#C4453B',
  black: '#1F1D19',
  backField: '#C4453B',
  backInk: '#AE382F',
  backFrame: '#FBF6F2',
} as const;

export function cardRadius(width: number) {
  return width * 0.085;
}

interface CardFaceProps {
  card: PlayingCard;
  width: number;
}

/**
 * The face of a card, drawn typographically: corner indices top-left and
 * bottom-right (mirrored, as on a real card) around a large suit mark.
 * Court cards get their letter rather than portrait artwork.
 */
export function CardFace({ card, width }: CardFaceProps) {
  const ink = isRed(card.suit) ? CARD_COLORS.red : CARD_COLORS.black;
  const glyph = SUIT_GLYPH[card.suit];

  // Rotating the index itself (not its row) keeps it in the bottom-RIGHT
  // corner while turning it upside down, as on a real card.
  const index = (flipped: boolean) => (
    <View
      style={[
        styles.index,
        flipped ? styles.indexBottom : styles.indexTop,
        flipped && styles.indexFlipped,
      ]}
    >
      <Text
        style={[styles.rank, { fontSize: width * 0.15, color: ink }]}
        allowFontScaling={false}
      >
        {card.rank}
      </Text>
      <Text
        style={[styles.indexGlyph, { fontSize: width * 0.115, color: ink }]}
        allowFontScaling={false}
      >
        {glyph}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.card,
        {
          width,
          height: width / CARD_ASPECT,
          borderRadius: cardRadius(width),
          backgroundColor: CARD_COLORS.face,
          padding: width * 0.07,
        },
      ]}
    >
      {index(false)}

      <View style={styles.center} pointerEvents="none">
        <Text
          style={[styles.centerGlyph, { fontSize: width * 0.44, color: ink }]}
          allowFontScaling={false}
        >
          {glyph}
        </Text>
      </View>

      {index(true)}
    </View>
  );
}

interface CardBackProps {
  width: number;
}

/** The back of a card: a plain red field inside a light frame. */
export function CardBack({ width }: CardBackProps) {
  const inset = width * 0.07;
  return (
    <View
      style={[
        styles.card,
        {
          width,
          height: width / CARD_ASPECT,
          borderRadius: cardRadius(width),
          backgroundColor: CARD_COLORS.backField,
          borderColor: CARD_COLORS.backInk,
          padding: inset,
        },
      ]}
    >
      <View
        style={{
          flex: 1,
          borderRadius: cardRadius(width) * 0.7,
          borderWidth: Math.max(width * 0.014, 1.5),
          borderColor: CARD_COLORS.backFrame,
          backgroundColor: CARD_COLORS.backInk,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_COLORS.edge,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  index: {
    alignItems: 'center',
  },
  indexTop: {
    alignSelf: 'flex-start',
  },
  indexBottom: {
    alignSelf: 'flex-end',
  },
  indexFlipped: {
    transform: [{ rotate: '180deg' }],
  },
  rank: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  indexGlyph: {
    marginTop: -2,
    fontWeight: '600',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGlyph: {
    fontWeight: '500',
  },
});
