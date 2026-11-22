import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * Which end of an activity's range of outcomes was asked for.
 *
 * One vocabulary across all five, so the gesture is learned once: the left
 * corner is the low end, the right corner the high end. What that means is the
 * activity's business — heads/tails, all ones/all sixes, red/black, first
 * option/last option, minimum/maximum — but the direction never changes.
 */
export type OutcomeEnd = 'low' | 'high';

interface HiddenOutcomeZonesProps {
  onSelect: (end: OutcomeEnd) => void;
}

/**
 * Two invisible touch targets in the lower corners of a hero stage. Left
 * selects the low end, right the high end; the response is haptic only.
 *
 * Constraints these must keep satisfying:
 *   - no fill, border, ripple, or opacity change (`activeOpacity={1}`)
 *   - nothing rendered that hints at their presence
 *   - hidden from the accessibility tree entirely
 *   - no layout influence on the visible UI (absolutely positioned)
 *
 * **Place it as the FIRST child of a stage wrapper, before `HeroStage`.**
 * Later siblings take the touch, so the hero always wins its own area and a
 * zone only ever collects taps on space the hero does not occupy. Ordering it
 * last instead looks identical — these draw nothing — and silently arms a
 * cheat when someone taps the hero, which is the one failure this component
 * must not have. The circular heroes reach into the corners of their own
 * square box on every phone narrower than a Pro Max, so the overlap is the
 * normal case, not the edge case.
 *
 * What ordering cannot give you is a target that still exists. A stage sized
 * to hug its hero leaves nothing over; those stages owe the zones a band of
 * their own (see `paddingBottom` on the wheel and number picker).
 */
export function HiddenOutcomeZones({ onSelect }: HiddenOutcomeZonesProps) {
  return (
    <View
      style={styles.container}
      pointerEvents="box-none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <TouchableOpacity
        style={styles.zone}
        activeOpacity={1}
        onPress={() => onSelect('low')}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
      <TouchableOpacity
        style={styles.zone}
        activeOpacity={1}
        onPress={() => onSelect('high')}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  zone: {
    width: 76,
    height: 76,
  },
});
