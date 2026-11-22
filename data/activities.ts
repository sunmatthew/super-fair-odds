import { ImageSourcePropType } from 'react-native';

import { AccentName } from '../theme';
import { ActivityRoute } from '../navigation/types';

/**
 * Hero artwork for an activity. Swapping a placeholder symbol for real
 * artwork is a one-line change here — no layout code moves.
 *
 *   art: { kind: 'image', source: require('../assets/activities/home_coin.png') }
 */
export type ActivityArt =
  | { kind: 'symbol'; name: string }
  | { kind: 'image'; source: ImageSourcePropType };

export type ActivityId =
  | 'coin'
  | 'dice'
  | 'cards'
  | 'wheel'
  | 'numbers';

export interface Activity {
  id: ActivityId;
  /**
   * Sentence case. Anything that should read lowercase gets there through a
   * typography token, not through the string — see the Casing section of
   * CLAUDE.md.
   */
  title: string;
  art: ActivityArt;
  route: ActivityRoute;
  accent: AccentName;
  /** One-line description, used on placeholder screens. */
  blurb: string;
}

export const activities: Activity[] = [
  {
    id: 'coin',
    title: 'Flip a coin',
    art: { kind: 'symbol', name: 'centsign.circle.fill' },
    route: 'CoinFlip',
    accent: 'coin',
    blurb: 'Heads or tails, settled in a moment.',
  },
  {
    id: 'dice',
    title: 'Roll dice',
    art: { kind: 'symbol', name: 'die.face.5.fill' },
    route: 'DiceRoll',
    accent: 'dice',
    blurb: 'Roll one, two, or three dice.',
  },
  {
    id: 'cards',
    title: 'Draw a card',
    art: { kind: 'symbol', name: 'rectangle.stack.fill' },
    route: 'CardDraw',
    accent: 'cards',
    blurb: 'Pull a card from a shuffled deck.',
  },
  {
    id: 'wheel',
    title: 'Spin a wheel',
    art: { kind: 'symbol', name: 'chart.pie.fill' },
    route: 'Wheel',
    accent: 'wheel',
    blurb: 'Add your own options and spin.',
  },
  {
    id: 'numbers',
    title: 'Pick a number',
    art: { kind: 'symbol', name: 'number.circle.fill' },
    route: 'NumberPicker',
    accent: 'numbers',
    blurb: 'Choose a number from any range.',
  },
];

export const activityByRoute = Object.fromEntries(
  activities.map((a) => [a.route, a])
) as Record<ActivityRoute, Activity>;

export const activityById = Object.fromEntries(
  activities.map((a) => [a.id, a])
) as Record<ActivityId, Activity>;
