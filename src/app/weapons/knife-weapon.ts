import * as THREE from 'three';
import {
  _knifeBladeTex,
  _knifeBladeNrm,
  _leatherTex,
  _leatherNrm,
  _metalTex,
  _metalNorm,
} from '../weapon-textures';
import { box, cyl } from '../weapon-geometry';

export class KnifeWeapon {
  static build(): THREE.Group {
    const g = new THREE.Group();

    const matBlade = new THREE.MeshStandardMaterial({
      map: _knifeBladeTex,
      normalMap: _knifeBladeNrm,
      normalScale: new THREE.Vector2(0.9, 0.9),
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.94,
    });
    const matEdge = new THREE.MeshStandardMaterial({
      map: _knifeBladeTex,
      normalMap: _knifeBladeNrm,
      normalScale: new THREE.Vector2(0.5, 0.5),
      color: 0xb8b4a8,
      roughness: 0.06,
      metalness: 0.98,
    });
    const matFuller = new THREE.MeshStandardMaterial({
      map: _knifeBladeTex,
      normalMap: _knifeBladeNrm,
      normalScale: new THREE.Vector2(1.2, 1.2),
      color: 0x080808,
      roughness: 0.24,
      metalness: 0.9,
    });
    const matGuard = new THREE.MeshStandardMaterial({
      map: _metalTex,
      normalMap: _metalNorm,
      normalScale: new THREE.Vector2(0.7, 0.7),
      color: 0x111111,
      roughness: 0.42,
      metalness: 0.92,
    });
    const matGrip = new THREE.MeshStandardMaterial({
      map: _leatherTex,
      normalMap: _leatherNrm,
      normalScale: new THREE.Vector2(1.8, 1.8),
      color: 0x1a0e04,
      roughness: 0.96,
      metalness: 0.01,
    });
    const matGripDark = new THREE.MeshStandardMaterial({
      map: _leatherTex,
      normalMap: _leatherNrm,
      normalScale: new THREE.Vector2(1.8, 1.8),
      color: 0x0c0704,
      roughness: 0.99,
      metalness: 0.0,
    });
    const matPommel = new THREE.MeshStandardMaterial({
      map: _metalTex,
      normalMap: _metalNorm,
      normalScale: new THREE.Vector2(0.8, 0.8),
      color: 0x1c1c1c,
      roughness: 0.36,
      metalness: 0.9,
    });

    // Blade (ExtrudeGeometry — clip-point silhouette)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.bezierCurveTo(-0.05, -0.004, -0.13, -0.003, -0.172, 0.003);
    bladeShape.quadraticCurveTo(-0.192, 0.014, -0.202, 0.008);
    bladeShape.lineTo(-0.16, 0.023);
    bladeShape.lineTo(-0.005, 0.023);
    bladeShape.lineTo(0, 0.022);
    bladeShape.closePath();

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.005, bevelEnabled: false });
    const bladeMesh = new THREE.Mesh(bladeGeo, matBlade);
    bladeMesh.rotation.y = -Math.PI / 2;
    bladeMesh.position.set(0.0025, 0, 0);
    g.add(bladeMesh);

    // Flat-grind bevel
    const bevelShape = new THREE.Shape();
    bevelShape.moveTo(0, 0);
    bevelShape.bezierCurveTo(-0.05, -0.004, -0.13, -0.003, -0.172, 0.003);
    bevelShape.quadraticCurveTo(-0.192, 0.014, -0.202, 0.008);
    bevelShape.lineTo(-0.157, 0.011);
    bevelShape.lineTo(-0.004, 0.008);
    bevelShape.closePath();

    const bevelGeo = new THREE.ExtrudeGeometry(bevelShape, { depth: 0.0008, bevelEnabled: false });
    for (const ox of [0.0031, -0.0031]) {
      const bm = new THREE.Mesh(bevelGeo, matEdge);
      bm.rotation.y = -Math.PI / 2;
      bm.position.set(ox, 0, 0);
      g.add(bm);
    }

    // Fuller (blood groove)
    for (const ox of [0.0024, -0.0024])
      g.add(box(0.001, 0.006, 0.128, matFuller, ox, 0.012, -0.074));

    // Guard
    g.add(box(0.013, 0.042, 0.015, matGuard, 0, 0.003, 0.02));
    const quU = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.009, 0.02, 14), matGuard);
    quU.position.set(0, 0.034, 0.019);
    g.add(quU);
    const quL = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.016, 14), matGuard);
    quL.position.set(0, -0.017, 0.019);
    g.add(quL);
    g.add(
      box(
        0.014,
        0.042,
        0.002,
        new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.5, metalness: 0.86 }),
        0,
        0.003,
        0.012,
      ),
    );
    g.add(
      cyl(
        0.014,
        0.014,
        0.008,
        14,
        new THREE.MeshStandardMaterial({ color: 0x7a6828, roughness: 0.32, metalness: 0.8 }),
        0,
        0.002,
        0.033,
        Math.PI / 2,
      ),
    );

    // Grip — 22 leather washers
    const GRIP_START = 0.04;
    const WASHER_PITCH = 0.0054;
    for (let i = 0; i < 22; i++) {
      const t = i / 21;
      const taper = 1.0 - 0.14 * Math.pow(2 * t - 1, 2);
      const r = 0.0135 * taper;
      const mat = i % 2 === 0 ? matGrip : matGripDark;
      const washer = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.005, 12), mat);
      washer.rotation.x = Math.PI / 2;
      washer.position.set(0, 0.002, GRIP_START + WASHER_PITCH * i);
      g.add(washer);
    }

    // Pommel
    const POM_Z = GRIP_START + WASHER_PITCH * 22 + 0.002;
    const pomCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.008, 14),
      matPommel,
    );
    pomCollar.rotation.x = Math.PI / 2;
    pomCollar.position.set(0, 0.002, POM_Z + 0.004);
    g.add(pomCollar);
    const pomBody = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.024, 14), matPommel);
    pomBody.rotation.x = Math.PI / 2;
    pomBody.position.set(0, 0.002, POM_Z + 0.02);
    g.add(pomBody);
    const pomCap = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.018, 0.012, 14), matPommel);
    pomCap.rotation.x = Math.PI / 2;
    pomCap.position.set(0, 0.002, POM_Z + 0.036);
    g.add(pomCap);
    g.add(
      cyl(
        0.004,
        0.004,
        0.003,
        12,
        new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 1.0 }),
        0,
        0.008,
        POM_Z + 0.043,
        Math.PI / 2,
      ),
    );

    return g;
  }
}
