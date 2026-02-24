import * as THREE from 'three';
import { box, cyl } from '../weapon-geometry';

export class HandsWeapon {

  /**
   * Toggle fist/open pose on one hand sub-group.
   * handsGroup.children[0] = rightHand, [1] = leftHand.
   */
  static setFist(handsGroup: THREE.Group, idx: 0 | 1, fist: boolean): void {
    const hand = handsGroup.children[idx] as THREE.Group;
    const openGrp = hand.getObjectByName('open') as THREE.Group | undefined;
    const fistGrp = hand.getObjectByName('fist') as THREE.Group | undefined;
    if (openGrp) openGrp.visible = !fist;
    if (fistGrp) fistGrp.visible = fist;
  }

  static build(): THREE.Group {
    const g = new THREE.Group();

    const matSkin = new THREE.MeshStandardMaterial({
      color: 0xc08050, roughness: 0.72, metalness: 0.0,
    });
    const matSkinDark = new THREE.MeshStandardMaterial({
      color: 0x9c6438, roughness: 0.80, metalness: 0.0,
    });
    const matNail = new THREE.MeshStandardMaterial({
      color: 0xd4a87a, roughness: 0.35, metalness: 0.02,
    });
    const matVein = new THREE.MeshStandardMaterial({
      color: 0x8a5030, roughness: 0.90, metalness: 0.0,
    });
    const matSleeve = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.88, metalness: 0.02,
    });

    function buildHand(side: 1 | -1): THREE.Group {
      const h = new THREE.Group();
      const s = side;

      // ── Always-visible: wrist, forearm, elbow, upper arm, shoulder ────────
      const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.080, 12), matSkin);
      wrist.rotation.x = Math.PI / 2;
      wrist.position.set(0, 0, 0.072);
      h.add(wrist);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 0.170, 12), matSkin);
      forearm.rotation.x = Math.PI / 2;
      forearm.position.set(0, -0.004, 0.162);
      h.add(forearm);

      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.048, 0.030, 12), matSleeve);
      sleeve.rotation.x = Math.PI / 2;
      sleeve.position.set(0, -0.002, 0.250);
      h.add(sleeve);

      // Elbow — sphere at the bend, pops into view during hook
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 8), matSkin);
      elbow.position.set(0, -0.006, 0.272);
      h.add(elbow);

      // Upper arm — extends back behind elbow; swings into view when arm rotates for hook
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.044, 0.160, 12), matSkin);
      upperArm.rotation.x = Math.PI / 2;
      upperArm.position.set(0, -0.006, 0.348);
      h.add(upperArm);

      // Long sleeve covering upper arm
      const upperSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.050, 0.162, 12), matSleeve);
      upperSleeve.rotation.x = Math.PI / 2;
      upperSleeve.position.set(0, -0.004, 0.348);
      h.add(upperSleeve);

      // Shoulder cap
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), matSleeve);
      shoulder.scale.set(1.0, 0.85, 1.0);
      shoulder.position.set(0, -0.004, 0.428);
      h.add(shoulder);

      // ── Open hand ─────────────────────────────────────────────────────────
      const openGroup = new THREE.Group();
      openGroup.name = 'open';

      openGroup.add(box(0.080, 0.016, 0.088, matSkin, 0, 0, 0));
      openGroup.add(box(0.078, 0.004, 0.086, matSkinDark, 0, 0.010, 0));
      for (let v = 0; v < 3; v++)
        openGroup.add(box(0.004, 0.003, 0.060, matVein, (-0.020 + v * 0.020) * s, 0.013, -0.010));

      const fingerDefs: { ox: number; len: [number, number, number]; r: [number, number, number] }[] = [
        { ox: -0.029, len: [0.030, 0.024, 0.018], r: [0.012, 0.010, 0.008] },
        { ox: -0.009, len: [0.034, 0.026, 0.020], r: [0.012, 0.010, 0.008] },
        { ox:  0.011, len: [0.032, 0.024, 0.018], r: [0.011, 0.009, 0.007] },
        { ox:  0.030, len: [0.024, 0.018, 0.014], r: [0.009, 0.008, 0.007] },
      ];
      for (const fd of fingerDefs) {
        let zOff = -0.044;
        fd.len.forEach((l, i) => {
          const seg = new THREE.Mesh(
            new THREE.CylinderGeometry(fd.r[i] * 0.9, fd.r[i], l, 8), matSkin);
          seg.rotation.x = Math.PI / 2;
          seg.position.set(fd.ox * s, 0.001, zOff - l / 2);
          openGroup.add(seg);
          if (i > 0)
            openGroup.add(cyl(fd.r[i] * 1.05, fd.r[i] * 1.05, 0.005, 8, matSkinDark,
              fd.ox * s, 0.002, zOff, Math.PI / 2));
          if (i === 2)
            openGroup.add(box(fd.r[i] * 1.4, 0.003, l * 0.55, matNail,
              fd.ox * s, fd.r[i] + 0.002, zOff - l * 0.35));
          zOff -= l;
        });
      }
      const thumbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.030, 8), matSkin);
      thumbBase.rotation.set(Math.PI / 2, 0, -0.5 * s);
      thumbBase.position.set(-0.044 * s, 0.002, -0.018);
      openGroup.add(thumbBase);
      const thumbTip = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.024, 8), matSkin);
      thumbTip.rotation.set(Math.PI / 2, 0, -0.6 * s);
      thumbTip.position.set(-0.052 * s, 0.001, -0.040);
      openGroup.add(thumbTip);
      openGroup.add(box(0.014, 0.003, 0.016, matNail, -0.052 * s, 0.012, -0.042));
      h.add(openGroup);

      // ── Fist (hidden at rest) ─────────────────────────────────────────────
      const fistGroup = new THREE.Group();
      fistGroup.name = 'fist';
      fistGroup.visible = false;

      // Palm + curled finger body
      fistGroup.add(box(0.078, 0.036, 0.070, matSkin,      0,  0.004,  0.002));
      // Knuckle ridge (front face)
      fistGroup.add(box(0.076, 0.012, 0.014, matSkin,      0,  0.022, -0.040));
      // Knuckle bumps × 4
      for (let k = 0; k < 4; k++)
        fistGroup.add(cyl(0.009, 0.009, 0.011, 8, matSkin,
          (-0.028 + k * 0.019) * s, 0.029, -0.040, 0, 0, 0));
      // Curled finger pads (front-facing strip)
      fistGroup.add(box(0.074, 0.012, 0.018, matSkinDark,  0,  0.014, -0.048));
      // Fingernail strips
      for (let k = 0; k < 4; k++)
        fistGroup.add(box(0.012, 0.003, 0.014, matNail,
          (-0.028 + k * 0.019) * s, 0.026, -0.042));
      // Thumb tucked along side
      fistGroup.add(cyl(0.010, 0.012, 0.034, 8, matSkin,
        -0.046 * s, 0.004, -0.016, Math.PI / 2, 0, 0.3 * s));
      h.add(fistGroup);

      return h;
    }

    const rightHand = buildHand(1);
    rightHand.position.set(0.095, -0.015, 0);
    rightHand.rotation.set(0.10, 0.10, 0.06);
    g.add(rightHand);

    const leftHand = buildHand(-1);
    leftHand.position.set(-0.095, -0.020, 0.030);
    leftHand.rotation.set(0.08, -0.10, -0.06);
    g.add(leftHand);

    return g;
  }
}
