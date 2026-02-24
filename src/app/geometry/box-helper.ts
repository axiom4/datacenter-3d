import * as THREE from 'three';

/** Axis-aligned box mesh with optional position + rotation. */
export class BoxHelper {
  static create(
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
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    return m;
  }
}
