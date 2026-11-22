import { useCallback, useRef, useState } from 'react';

import { shuffle } from '../../services/random';
import { recordResult } from '../../services/history';
import { CardHandle } from './Card';
import { buildDeck, cardName, isRed, PlayingCard } from './types';
import { RequestedEndOptions } from '../../components';

/**
 * Owns the deck. Draws are without replacement: the deck depletes as you go
 * and reshuffles on its own once exhausted, and the user can reshuffle at any
 * time. As with the coin and dice, the drawn card is only published once the
 * animation has settled.
 */
export function useCardDraw(
  cardRef: React.RefObject<CardHandle | null>,
  { peekRequestedEnd }: RequestedEndOptions
) {
  const [deck, setDeck] = useState<PlayingCard[]>(() => shuffle(buildDeck()));
  const [drawn, setDrawn] = useState<PlayingCard | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Mirror of `deck`, so a draw reads the current deck without re-creating
  // the callback on every state change.
  const deckRef = useRef(deck);
  deckRef.current = deck;

  const pendingCard = useRef<PlayingCard | null>(null);
  const pendingDeck = useRef<PlayingCard[]>([]);

  const requestDraw = useCallback(() => {
    if (isDrawing || cardRef.current?.isBusy()) return;

    // Exhausted decks reshuffle themselves rather than dead-ending.
    const source =
      deckRef.current.length > 0 ? deckRef.current : shuffle(buildDeck());

    // The one place a pre-selected outcome is allowed to influence anything.
    // Red or black, never a named card: the draw stays uniform *within* the
    // colour because the deck is already shuffled, so taking the first match
    // is taking a random one. A depleted deck may hold none of that colour,
    // in which case the request quietly goes unserved rather than dead-ending.
    const end = peekRequestedEnd();
    const found =
      end === null
        ? 0
        : source.findIndex((card) => isRed(card.suit) === (end === 'low'));
    const index = found >= 0 ? found : 0;

    const next = source[index];
    pendingCard.current = next;
    pendingDeck.current = source.filter((_, i) => i !== index);

    setIsDrawing(true);
    cardRef.current?.reveal(next);
  }, [cardRef, isDrawing, peekRequestedEnd]);

  const handleRevealed = useCallback(() => {
    if (pendingCard.current) {
      recordResult({
        activity: 'cards',
        label: cardName(pendingCard.current),
      });
    }
    setDrawn(pendingCard.current);
    deckRef.current = pendingDeck.current;
    setDeck(pendingDeck.current);
    setIsDrawing(false);
  }, []);

  const shuffleDeck = useCallback(() => {
    if (isDrawing) return;
    const fresh = shuffle(buildDeck());
    deckRef.current = fresh;
    setDeck(fresh);
    setDrawn(null);
    cardRef.current?.reset();
  }, [cardRef, isDrawing]);

  return {
    remaining: deck.length,
    drawn,
    isDrawing,
    requestDraw,
    handleRevealed,
    shuffleDeck,
    buttonLabel: drawn ? 'Draw again' : 'Draw',
  };
}
