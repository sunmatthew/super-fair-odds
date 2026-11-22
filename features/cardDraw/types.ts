export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank =
  | 'A' | '2' | '3' | '4' | '5' | '6' | '7'
  | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface PlayingCard {
  suit: Suit;
  rank: Rank;
}

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export const RANKS: Rank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
];

export const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_NAME: Record<Suit, string> = {
  spades: 'Spades',
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
};

export const RANK_NAME: Record<Rank, string> = {
  A: 'Ace',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '10': 'Ten',
  J: 'Jack',
  Q: 'Queen',
  K: 'King',
};

export const DECK_SIZE = SUITS.length * RANKS.length;

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

/** "Ace of Hearts" */
export function cardName(card: PlayingCard): string {
  return `${RANK_NAME[card.rank]} of ${SUIT_NAME[card.suit]}`;
}

export function buildDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}
