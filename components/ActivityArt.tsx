import React from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ActivityArt as Art } from '../data/activities';
import { accents, AccentName, radius } from '../theme';

interface ActivityArtProps {
  art: Art;
  accent: AccentName;
  size: number;
}

/**
 * Renders an activity's hero object. Symbols are stand-ins until real
 * artwork lands; both branches fill the same box, so swapping one for the
 * other never shifts the surrounding layout.
 */
export function ActivityArt({ art, accent, size }: ActivityArtProps) {
  const { tint } = accents[accent];

  if (art.kind === 'image') {
    return (
      <Image
        source={art.source}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessible={false}
      />
    );
  }

  if (Platform.OS !== 'ios') {
    // SF Symbols are iOS-only; keep the footprint identical elsewhere.
    return (
      <View
        style={[
          styles.fallback,
          { width: size * 0.72, height: size * 0.72, backgroundColor: tint },
        ]}
      />
    );
  }

  return (
    <SymbolView
      name={art.name as never}
      size={size}
      tintColor={tint}
      type="hierarchical"
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: radius.lg,
    opacity: 0.85,
  },
});
