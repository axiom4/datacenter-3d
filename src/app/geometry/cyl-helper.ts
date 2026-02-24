import * as THREE from 'three';

/** Cylinder / cone mesh with optional position + rotation. */
export class CylHelper {
  static create(
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
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    return m;
  }
}
