import * as THREE from 'three';

/**
 * Lathe revolution mesh — points are [radius, z_along_axis].
 * Mesh is oriented along Z (lathe Y-axis → world Z-axis).
 */
export class LatheHelper {
  static create(
    points: [number, number][],
    segs = 24,
    mat: THREE.Material,
    px = 0,
    py = 0,
    pz = 0,
  ): THREE.Mesh {
    const vpts = points.map(([r, z]) => new THREE.Vector2(r, z));
    const geo = new THREE.LatheGeometry(vpts, segs);
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(px, py, pz);
    return m;
  }
}
