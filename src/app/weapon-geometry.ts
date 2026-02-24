/**
 * weapon-geometry.ts — barrel re-export
 *
 * Each geometry helper lives in its own class file under ./geometry/.
 * The backward-compatible function aliases below keep all consumers unchanged.
 */
import * as THREE from 'three';

export { BoxHelper } from './geometry/box-helper';
export { CylHelper } from './geometry/cyl-helper';
export { LatheHelper } from './geometry/lathe-helper';

import { BoxHelper } from './geometry/box-helper';
import { CylHelper } from './geometry/cyl-helper';
import { LatheHelper } from './geometry/lathe-helper';

export const box = (
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  px = 0,
  py = 0,
  pz = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh => BoxHelper.create(w, h, d, mat, px, py, pz, rx, ry, rz);

export const cyl = (
  rt: number,
  rb: number,
  h: number,
  segs: number,
  mat: THREE.Material,
  px = 0,
  py = 0,
  pz = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh => CylHelper.create(rt, rb, h, segs, mat, px, py, pz, rx, ry, rz);

export const lathe = (
  points: [number, number][],
  segs = 24,
  mat: THREE.Material,
  px = 0,
  py = 0,
  pz = 0,
): THREE.Mesh => LatheHelper.create(points, segs, mat, px, py, pz);
