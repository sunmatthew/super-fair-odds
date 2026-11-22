import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Card, CardHandle } from './Card';
import { CardStack } from './CardStack';
import { CARD_ASPECT } from './CardArt';
import { useCardDraw } from './useCardDraw';
import { cardName, isRed, SUIT_GLYPH } from './types';
import {
  ActivityScreen,
  HeroStage,
  HiddenOutcomeZones,
  PrimaryButton,
  ResultCard,
  SecondaryButton,
  useRequestedEnd,
} from '../../components';
import { activityById } from '../../data/activities';
import { accents, colors, radius, spacing, typography } from '../../theme';


interface CardDrawScreenProps {
  onBack: () => void;
}

export function CardDrawScreen({ onBack }: CardDrawScreenProps) {
  const { width } = useWindowDimensions();
  const cardRef = useRef<CardHandle>(null);

  const { select, peek } = useRequestedEnd();
  const {
    remaining,
    drawn,
    isDrawing,
    requestDraw,
    handleRevealed,
    shuffleDeck,
    buttonLabel,
  } = useCardDraw(cardRef, { peekRequestedEnd: peek });

  const cardWidth = useMemo(() => Math.min(Math.round(width * 0.4), 158), [width]);
  const cardHeight = cardWidth / CARD_ASPECT;
  const lift = Math.round(cardHeight * 0.5);


  const showing = isDrawing ? null : drawn;
  const palette = showing
    ? isRed(showing.suit)
      ? { ink: accents.cards.tint, soft: accents.cards.soft, label: 'Red' }
      : { ink: colors.primaryText, soft: colors.surfaceSunken, label: 'Black' }
    : null;

  return (
    <ActivityScreen title={activityById['cards'].title} onBack={onBack}>
      <View style={styles.stage}>
        <HiddenOutcomeZones onSelect={select} />

        <HeroStage
          style={{ width: cardWidth, height: cardHeight + lift }}
          onActivate={requestDraw}
          accessibilityLabel={
            drawn
              ? `${cardName(drawn)}. ${remaining} cards left in the deck`
              : `Deck, ${remaining} cards`
          }
          accessibilityHint="Double tap to draw a card"
        >
          <CardStack width={cardWidth} remaining={remaining} />
          <Card
            ref={cardRef}
            width={cardWidth}
            lift={lift}
            onRevealed={handleRevealed}
          />
        </HeroStage>
      </View>

      <View style={styles.controls}>
        <ResultCard
          variant="detail"
          title={isDrawing ? '' : showing ? cardName(showing) : 'Ready'}
          subtitle={
            isDrawing
              ? undefined
              : showing
                ? `${remaining} cards left`
                : `${remaining} cards in the deck`
          }
          animationKey={
            showing ? `${showing.rank}${showing.suit}${remaining}` : 'idle'
          }
          leading={
            showing && palette ? (
              <View style={[styles.emblem, { backgroundColor: palette.soft }]}>
                <Text
                  style={[styles.emblemGlyph, { color: palette.ink }]}
                  allowFontScaling={false}
                >
                  {SUIT_GLYPH[showing.suit]}
                </Text>
              </View>
            ) : null
          }
          trailing={
            showing && palette ? (
              <View style={[styles.badge, { backgroundColor: palette.soft }]}>
                <Text style={[styles.badgeText, { color: palette.ink }]}>
                  {palette.label}
                </Text>
              </View>
            ) : null
          }
        />

        <SecondaryButton
          label="Shuffle deck"
          symbol="shuffle"
          onPress={shuffleDeck}
          disabled={isDrawing}
          accessibilityHint="Returns all cards and shuffles"
        />

        <PrimaryButton
          label={buttonLabel}
          onPress={requestDraw}
          disabled={isDrawing}
          accessibilityHint="Draws the top card"
        />
      </View>
    </ActivityScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemGlyph: {
    fontSize: 21,
    lineHeight: 26,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: '600',
  },
});
