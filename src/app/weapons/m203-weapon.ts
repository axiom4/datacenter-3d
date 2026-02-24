import * as THREE from 'three';
import { box, cyl } from '../weapon-geometry';

export class M203Weapon {
  static build(): THREE.Group {
    const g = new THREE.Group();
    const matAlum = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.45,
      metalness: 0.8,
    });
    const matPolymer = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.78,
      metalness: 0.05,
    });

    // Receiver housing
    g.add(box(0.042, 0.046, 0.164, matPolymer, 0, -0.028, -0.073));
    for (const sx of [-0.022, 0.022]) g.add(box(0.004, 0.04, 0.164, matAlum, sx, -0.028, -0.073));
    g.add(box(0.005, 0.014, 0.028, matAlum, 0.024, -0.022, -0.04));

    // 40mm barrel
    const pts40: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts40.push(new THREE.Vector2(i < 2 ? 0.02 : 0.018, t * 0.286));
    }
    const brl40 = new THREE.Mesh(new THREE.LatheGeometry(pts40, 20), matAlum);
    brl40.rotation.x = Math.PI / 2;
    brl40.position.set(0, -0.028, -0.286 / 2 - 0.005);
    g.add(brl40);

    for (let k = 0; k < 5; k++)
      g.add(cyl(0.02, 0.02, 0.008, 16, matAlum, 0, -0.028, -0.026 - k * 0.044, Math.PI / 2));
    g.add(cyl(0.023, 0.023, 0.012, 16, matAlum, 0, -0.028, -0.286, Math.PI / 2));

    // Rear trunion
    g.add(box(0.044, 0.022, 0.018, matAlum, 0, 0.0, 0.0));
    g.add(cyl(0.004, 0.004, 0.05, 8, matAlum, 0, 0.0, 0.0, 0));

    // Quadrant leaf sight
    g.add(box(0.003, 0.034, 0.022, matAlum, -0.026, -0.014, -0.022));
    for (let s = 0; s < 4; s++)
      g.add(
        box(
          0.003,
          0.002,
          0.018,
          new THREE.MeshStandardMaterial({ color: 0x888888 }),
          -0.027,
          -0.006 + s * 0.009,
          -0.022,
        ),
      );

    // Trigger guard + trigger
    g.add(box(0.034, 0.006, 0.036, matPolymer, 0, -0.05, -0.04));
    g.add(box(0.005, 0.018, 0.005, matPolymer, 0, -0.042, -0.034));

    // Safety
    g.add(cyl(0.005, 0.005, 0.008, 8, matPolymer, -0.026, -0.028, -0.004, 0));

    // Barrel release lever
    g.add(box(0.009, 0.012, 0.024, matPolymer, 0.026, -0.026, -0.06));

    // Sling swivel
    g.add(box(0.006, 0.016, 0.006, matAlum, 0, -0.053, -0.14));

    return g;
  }
}
