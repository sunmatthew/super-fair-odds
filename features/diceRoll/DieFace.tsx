import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

import {
  facesViewer,
  Mat4,
  multiply4,
  perspective4,
  rotateX4,
  rotateY4,
  rotateZ4,
} from './matrix';
import { DieValue, PIP_GRID } from './types';

export const DIE_COLORS = {
  face: '#F4F0E6',
  faceEdge: '#DCD5C4',
  pip: '#26231D',
  shadow: '#1A1917',
} as const;

interface DieFaceProps {
  value: DieValue;
  size: number;
  /** Static placement of this face on the cube: rotate to its normal, push out. */
  placement: Mat4;
  rotX: SharedValue<number>;
  rotY: SharedValue<number>;
  rotZ: SharedValue<number>;
  perspective: number;
  /** Constant camera tilt, so a settled die still reads as a solid object. */
  viewTilt: Mat4;
}

/**
 * One side of the cube. It carries the whole 3D transform itself — there is no
 * rotating parent, because RN would flatten it. Pips are ordinary children and
 * are *correctly* flattened onto the face's plane.
 */
export function DieFace({
  value,
  size,
  placement,
  rotX,
  rotY,
  rotZ,
  perspective,
  viewTilt,
}: DieFaceProps) {
  // Faces overlap very slightly so the cube's edges close up instead of
  // showing a seam between two rounded rectangles.
  const faceSize = size * 1.03;
  const pipSize = faceSize * 0.17;

  const state = useDerivedValue(() => {
    const orientation = multiply4(
      rotateZ4(rotZ.value),
      multiply4(rotateX4(rotX.value), rotateY4(rotY.value))
    );
    const placed = multiply4(multiply4(viewTilt, orientation), placement);

    // Surface normal in view space: column 2 of the composed rotation.
    const normalY = placed[9];
    const normalZ = placed[10];

    // Flat key light from the front, lifted slightly. A face square to the
    // camera stays clean; grazing faces darken, and upward faces catch more.
    const shade = Math.min(Math.max(0.3 * (1 - normalZ) + 0.06 * normalY, 0), 0.34);

    return {
      matrix: multiply4(perspective4(perspective), placed),
      visible: facesViewer(placed),
      shade,
    };
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: state.value.visible ? 1 : 0,
    transform: [{ matrix: state.value.matrix }],
  }));

  const shadeStyle = useAnimatedStyle(() => ({ opacity: state.value.shade }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.face,
        {
          width: faceSize,
          height: faceSize,
          borderRadius: faceSize * 0.07,
          padding: faceSize * 0.14,
        },
        animatedStyle,
      ]}
    >
      <Animated.View
        style={[styles.shade, { borderRadius: faceSize * 0.07 }, shadeStyle]}
      />
      {PIP_GRID[value].map((filled, i) => (
        <View key={i} style={styles.cell}>
          {filled ? (
            <View
              style={{
                width: pipSize,
                height: pipSize,
                borderRadius: pipSize / 2,
                backgroundColor: DIE_COLORS.pip,
              }}
            />
          ) : null}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    backgroundColor: DIE_COLORS.face,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIE_COLORS.faceEdge,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8C8577',
  },
  cell: {
    width: '33.333%',
    height: '33.333%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
