/**
 * Minimal column-major 4x4 matrix helpers, worklet-safe.
 *
 * Why this exists: React Native has no `translateZ` shorthand, rejects a
 * `matrix` entry alongside other transform keys, and — crucially — has no
 * `transformStyle: preserve-3d`, so a child's 3D transform is flattened into
 * its parent's plane. A cube therefore cannot be built by rotating a container
 * full of offset faces.
 *
 * Instead every face is a leaf view carrying ONE fully composed matrix:
 *
 *     perspective · rotateZ · rotateX · rotateY · faceRotation · pushOut
 *
 * All of it in a single transform, so there is no nesting left to flatten.
 *
 * Layout matches CSS `matrix3d`: index = column * 4 + row.
 */
export type Mat4 = number[];

export function rotateX4(deg: number): Mat4 {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

export function rotateY4(deg: number): Mat4 {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

export function rotateZ4(deg: number): Mat4 {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function translateZ4(z: number): Mat4 {
  'worklet';
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1];
}

/** CSS `perspective(d)` — the m34 = -1/d term that does the depth divide. */
export function perspective4(d: number): Mat4 {
  'worklet';
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / d, 0, 0, 0, 1];
}

/** a · b, applying b to the geometry first — same order as a CSS transform list. */
export function multiply4(a: Mat4, b: Mat4): Mat4 {
  'worklet';
  const out: Mat4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

/**
 * Z component of the surface normal, i.e. column 2 row 2. Positive means the
 * face points at the camera. Used instead of `backfaceVisibility` so culling
 * stays under our control and matches the matrix we actually applied.
 */
export function facesViewer(m: Mat4): boolean {
  'worklet';
  return m[10] > 0.01;
}
