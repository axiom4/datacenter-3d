import * as THREE from 'three';
import {
  _stippleTex, _stippleNorm,
  matReceiver, matMetal, matBarrel, matFDE, matMuzzle,
} from '../weapon-textures';
import { box, cyl, lathe } from '../weapon-geometry';
import { buildEOTech, buildPEQ15, buildScoutLight, matACOGRubber } from '../weapon-parts';
import { M203Weapon } from './m203-weapon';

export class RifleWeapon {

  static build(): THREE.Group {
    const g = new THREE.Group();

    // ── Upper receiver ──────────────────────────────────────────────────────────
    g.add(box(0.038, 0.044, 0.220, matReceiver, 0,  0.010, -0.002));
    g.add(box(0.022, 0.009, 0.222, matMetal,    0,  0.040, -0.002));
    for (let i = 0; i < 11; i++)
      g.add(box(0.020, 0.004, 0.010, matReceiver, 0, 0.047, -0.108 + i * 0.022));
    g.add(box(0.012, 0.018, 0.026, matMetal,    0.022,  0.006,  0.048));
    g.add(cyl(0.007, 0.007, 0.012, 16, matMetal, 0.028, 0.006, 0.048, 0, 0, Math.PI / 2));
    g.add(box(0.004, 0.024, 0.062, matMetal,    0.021,  0.006, -0.030));
    g.add(cyl(0.003, 0.003, 0.056, 8, matBarrel, 0.022, 0.022, -0.005, Math.PI / 2));
    g.add(box(0.006, 0.020, 0.010, matMetal,    0.021,  0.012,  0.002));
    g.add(cyl(0.005, 0.005, 0.044, 12, matMetal, 0, 0.000,  0.102, 0, 0, Math.PI / 2));
    g.add(cyl(0.005, 0.005, 0.044, 12, matMetal, 0, 0.000, -0.098, 0, 0, Math.PI / 2));
    g.add(box(0.038, 0.008, 0.010, matMetal, 0, 0.040, 0.112));

    // ── Lower receiver ──────────────────────────────────────────────────────────
    g.add(box(0.034, 0.036, 0.200, matReceiver, 0, -0.016,  0.002));
    const magWell = box(0.030, 0.030, 0.072, matReceiver, 0, -0.038, -0.006);
    magWell.rotation.x = 0.04;
    g.add(magWell);
    g.add(cyl(0.005, 0.005, 0.011, 12, matMetal,  0.022, -0.002,  0.076, 0, 0, Math.PI / 2));
    g.add(cyl(0.005, 0.005, 0.011, 12, matMetal, -0.022, -0.002,  0.076, 0, 0, Math.PI / 2));
    g.add(cyl(0.004, 0.004, 0.042, 10, matMetal, 0, -0.018, -0.095, 0, 0, Math.PI / 2));
    g.add(box(0.010, 0.008, 0.010, matReceiver, 0, -0.006, 0.118));

    // ── Barrel (10.5" government profile) ─────────────────────────────────────
    g.add(lathe([
      [0.013,  0.055],
      [0.013,  0.042],
      [0.012,  0.026],
      [0.0115, 0.000],
      [0.0115, -0.060],
      [0.0095, -0.064],
      [0.0087, -0.076],
      [0.0087, -0.148],
      [0.0098, -0.155],
      [0.0100, -0.162],
      [0.0100, -0.242],
      [0.0098, -0.250],
      [0.0098, -0.267],
      [0.0045, -0.267],
      [0.0045,  0.055],
    ], 24, matBarrel, 0, 0.022, 0));

    // Barrel nut (6-slot mil-spec)
    g.add(lathe([
      [0.017,  0.000],
      [0.020,  0.002],
      [0.020,  0.012],
      [0.019,  0.016],
      [0.017,  0.018],
      [0.017,  0.000],
    ], 24, matMetal, 0, 0.022, -0.090));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const cn = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.012, 0.020), matReceiver);
      cn.position.set(Math.cos(a) * 0.020, 0.022 + Math.sin(a) * 0.020, -0.092);
      cn.rotation.z = a;
      g.add(cn);
    }

    // Low-profile gas block
    g.add(lathe([
      [0.012,  0.000],
      [0.016,  0.002],
      [0.016,  0.018],
      [0.012,  0.020],
      [0.009,  0.020],
      [0.009,  0.000],
    ], 20, matMetal, 0, 0.022, -0.155));
    for (const gz of [-0.158, -0.166])
      g.add(cyl(0.002, 0.002, 0.016, 8, matMuzzle, 0, 0.006, gz, 0));

    // Gas tube
    g.add(cyl(0.003, 0.003, 0.078, 8, matBarrel, 0, 0.040, -0.116, Math.PI / 2));
    g.add(cyl(0.006, 0.006, 0.012, 10, matMetal,  0, 0.036, -0.080, Math.PI / 2));

    // ── A2 Birdcage flash hider ─────────────────────────────────────────────────
    g.add(lathe([
      [0.0098,  0.000],
      [0.011,   0.004],
      [0.011,   0.010],
      [0.013,   0.012],
      [0.013,   0.038],
      [0.011,   0.044],
      [0.010,   0.046],
      [0.0045,  0.046],
      [0.0045,  0.000],
    ], 24, matMuzzle, 0, 0.022, -0.269));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 1.5 - Math.PI * 0.75;
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.020, 0.026), matReceiver);
      slot.position.set(Math.sin(a) * 0.013, 0.022 + Math.cos(a) * 0.013, -0.282);
      slot.rotation.z = a;
      g.add(slot);
    }
    g.add(box(0.005, 0.010, 0.028, matMuzzle, 0, 0.009, -0.282));

    // ── CAR handguard ───────────────────────────────────────────────────────────
    const hgLen = 0.115;
    const hgZ   = -0.148;
    g.add(lathe([
      [0.000,  0.000],
      [0.000,  0.000],
      [0.024,  0.005],
      [0.024,  0.055],
      [0.022,  0.058],
      [0.000,  0.058],
      [0.000,  0.000],
    ], 20, matReceiver, 0, 0.022, hgZ - hgLen / 2));
    g.add(box(0.046, 0.024, hgLen,
      new THREE.MeshStandardMaterial({
        map: _stippleTex, normalMap: _stippleNorm,
        normalScale: new THREE.Vector2(1.0, 1.0),
        color: 0x0e0e0e, roughness: 0.90, metalness: 0.02,
      }), 0, 0.020, hgZ));
    g.add(box(0.046, 0.020, hgLen,
      new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.92, metalness: 0.02 }),
      0, -0.010, hgZ));
    g.add(cyl(0.026, 0.026, 0.008, 20, matMetal, 0, 0.010, hgZ - hgLen / 2 + 0.004, Math.PI / 2));
    g.add(cyl(0.026, 0.026, 0.008, 20, matMetal, 0, 0.010, hgZ + hgLen / 2 - 0.004, Math.PI / 2));
    g.add(cyl(0.024, 0.024, 0.012, 20, matMetal, 0, 0.022, hgZ + hgLen / 2 + 0.006, Math.PI / 2));
    g.add(cyl(0.022, 0.024, 0.006, 20, matMetal, 0, 0.022, hgZ + hgLen / 2 + 0.015, Math.PI / 2));
    for (let side = -1; side <= 1; side += 2) {
      for (let v = 0; v < 4; v++) {
        const vz = hgZ - hgLen / 2 + 0.018 + v * 0.022;
        g.add(box(0.008, 0.014, 0.012,
          new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1.0 }),
          side * 0.026, 0.010, vz));
      }
    }

    // ── AN/PEQ-15 ────────────────────────────────────────────────────────────────
    const peq = buildPEQ15();
    peq.position.set(0.000, 0.062, -0.038);
    g.add(peq);

    // ── SureFire M600C Scout Light ───────────────────────────────────────────────
    const sf = buildScoutLight();
    sf.position.set(-0.040, 0.022, -0.148);
    sf.rotation.z = Math.PI / 2;
    g.add(sf);

    // ── Charging handle ──────────────────────────────────────────────────────────
    g.add(box(0.038, 0.008, 0.028, matMetal,  0,  0.028,  0.066));
    g.add(box(0.044, 0.012, 0.016, matFDE,    0,  0.028,  0.082));
    g.add(cyl(0.003, 0.003, 0.010, 8, matMetal, 0, 0.024, 0.086, Math.PI / 2));

    // ── PMAG 30 Gen M3 Window ───────────────────────────────────────────────────
    const mag = new THREE.Group();
    const matMagBody = new THREE.MeshStandardMaterial({
      map: _stippleTex, normalMap: _stippleNorm,
      normalScale: new THREE.Vector2(1.2, 1.2),
      color: 0x0c0c0c, roughness: 0.88, metalness: 0.02,
    });
    const matMagDark = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.90 });
    mag.add(box(0.030, 0.096, 0.044, matMagBody));
    mag.add(box(0.028, 0.092, 0.010, matMagDark, 0, 0, -0.027));
    mag.add(box(0.028, 0.090, 0.006, matMagDark, 0, 0,  0.025));
    mag.add(box(0.005, 0.042, 0.014,
      new THREE.MeshStandardMaterial({ color: 0x1a2e1a, roughness: 0.3, transparent: true, opacity: 0.5 }),
      0.016, -0.008, 0));
    mag.add(box(0.034, 0.010, 0.048, matMetal, 0, -0.053, 0));
    mag.add(box(0.008, 0.008, 0.010, matMagDark, 0.016, -0.058, 0));
    for (let i = 0; i < 3; i++)
      mag.add(box(0.032, 0.005, 0.042, matMagDark, 0, 0.018 - i * 0.022, 0));
    mag.add(box(0.024, 0.008, 0.040,
      new THREE.MeshStandardMaterial({ color: 0xff8020, roughness: 0.5 }),
      0, 0.040, 0.004));
    mag.add(box(0.012, 0.012, 0.016, matReceiver, 0.014, -0.026, 0));
    mag.position.set(0, -0.072, -0.002);
    mag.rotation.x = 0.12;
    g.add(mag);

    // ── MOE Pistol Grip ──────────────────────────────────────────────────────────
    const grip = new THREE.Group();
    const matGripBlack = new THREE.MeshStandardMaterial({
      map: _stippleTex, normalMap: _stippleNorm,
      normalScale: new THREE.Vector2(2.0, 2.0),
      color: 0x0c0c0c, roughness: 0.94, metalness: 0.01,
    });
    grip.add(box(0.030, 0.082, 0.046, matGripBlack));
    grip.add(box(0.012, 0.074, 0.044,
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.96 }),
      -0.001, 0.002, -0.001));
    for (let i = 0; i < 3; i++)
      grip.add(box(0.010, 0.006, 0.044,
        new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.98 }),
        0, 0.022 - i * 0.018, -0.024));
    grip.add(box(0.022, 0.012, 0.042, matMetal, 0, -0.046, 0));
    grip.add(cyl(0.009, 0.009, 0.008, 8, matMuzzle, 0, -0.048, 0));
    grip.position.set(0, -0.074, 0.102);
    grip.rotation.x = 0.38;
    g.add(grip);

    // Trigger
    g.add(box(0.010, 0.022, 0.008, matMetal, 0, -0.042, 0.078));
    g.add(cyl(0.004, 0.004, 0.034, 10, matMetal, 0, -0.042, 0.078, 0, 0, Math.PI / 2));
    // Trigger guard
    g.add(box(0.024, 0.006, 0.062, matMetal, 0, -0.047, 0.072));
    g.add(box(0.008, 0.024, 0.006, matMetal, 0, -0.038, 0.042));
    g.add(box(0.008, 0.024, 0.006, matMetal, 0, -0.038, 0.102));
    g.add(cyl(0.006, 0.006, 0.024, 12, matMetal, 0, -0.047, 0.042, 0, 0, Math.PI / 2));

    // ── M4 Crane / SOPMOD stock ──────────────────────────────────────────────────
    g.add(cyl(0.0146, 0.0146, 0.150, 20, matReceiver, 0, 0.012, 0.208, Math.PI / 2));
    for (let i = 0; i < 6; i++)
      g.add(cyl(0.0150, 0.0150, 0.005, 20, matMetal, 0, 0.001, 0.140 + i * 0.023, Math.PI / 2));
    g.add(box(0.038, 0.042, 0.008, matMetal, 0, 0.008, 0.136));
    g.add(cyl(0.0190, 0.0190, 0.010, 18, matMetal, 0, 0.012, 0.144, Math.PI / 2));
    for (let cs = 0; cs < 3; cs++) {
      const a = (cs / 3) * Math.PI * 2;
      const cn = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.012), matReceiver);
      cn.position.set(Math.cos(a) * 0.020, 0.012 + Math.sin(a) * 0.020, 0.144);
      g.add(cn);
    }
    // Stock body
    g.add(box(0.028, 0.052, 0.120, matGripBlack,  0,  0.006, 0.242));
    g.add(box(0.026, 0.012, 0.098, matGripBlack,  0,  0.034, 0.230));
    g.add(box(0.026, 0.022, 0.050, matGripBlack,  0,  0.030, 0.258));
    // Sling loop
    g.add(box(0.008, 0.026, 0.012, matMetal,  0, -0.020, 0.294));
    g.add(cyl(0.004, 0.004, 0.024, 8, matMetal, 0, -0.010, 0.294, 0));
    // QD socket
    g.add(cyl(0.006, 0.006, 0.010, 12, matMetal, 0.016, 0.006, 0.262, 0, 0, Math.PI / 2));
    // Rubber buttpad
    g.add(box(0.030, 0.058, 0.014, matACOGRubber, 0, 0.006, 0.305));
    for (let r = 0; r < 3; r++)
      g.add(box(0.030, 0.004, 0.014, matMetal, 0, -0.014 + r * 0.016, 0.310));
    // Release lever
    g.add(box(0.014, 0.010, 0.018, matGripBlack, 0, 0.034, 0.194));

    // ── MBUS rear flip-up sight ─────────────────────────────────────────────────
    const mbusRearZ = 0.068;
    const mbusRailY = 0.051;
    g.add(box(0.022, 0.008, 0.024,
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.70, metalness: 0.10 }),
      0, mbusRailY, mbusRearZ));
    g.add(box(0.008, 0.010, 0.010,
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.75 }),
      0.016, mbusRailY - 0.002, mbusRearZ - 0.004));
    g.add(box(0.020, 0.012, 0.014,
      new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.72 }),
      0, mbusRailY + 0.010, mbusRearZ));
    g.add(cyl(0.003, 0.003, 0.024, 8, matMetal, 0, mbusRailY + 0.010, mbusRearZ, 0, 0, Math.PI / 2));
    g.add(box(0.018, 0.024, 0.004,
      new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.68, metalness: 0.08 }),
      0, mbusRailY + 0.022, mbusRearZ));
    g.add(box(0.012, 0.016, 0.002,
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 }),
      0, mbusRailY + 0.022, mbusRearZ + 0.002));
    g.add(cyl(0.003, 0.003, 0.003, 10,
      new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1.0 }),
      0, mbusRailY + 0.034, mbusRearZ, Math.PI / 2));
    g.add(cyl(0.003, 0.003, 0.012, 8, matMuzzle, 0.008, mbusRailY + 0.016, mbusRearZ + 0.008, 0));

    // ── MBUS front flip-up sight ────────────────────────────────────────────────
    const mbusFrontZ = -0.198;
    const mbusFrontY =  0.035;
    g.add(box(0.026, 0.008, 0.024,
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.70, metalness: 0.10 }),
      0, mbusFrontY, mbusFrontZ));
    g.add(cyl(0.003, 0.003, 0.030, 8, matMetal, -0.015, mbusFrontY - 0.002, mbusFrontZ, 0));
    g.add(box(0.014, 0.014, 0.012,
      new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.72 }),
      0, mbusFrontY + 0.011, mbusFrontZ));
    g.add(cyl(0.003, 0.003, 0.018, 8, matMetal, 0, mbusFrontY + 0.011, mbusFrontZ, 0, 0, Math.PI / 2));
    g.add(box(0.004, 0.026, 0.003,
      new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.66, metalness: 0.06 }),
      0, mbusFrontY + 0.025, mbusFrontZ));
    g.add(cyl(0.003, 0.003, 0.004, 8,
      new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00cc22, emissiveIntensity: 1.8, roughness: 0.1 }),
      0, mbusFrontY + 0.038, mbusFrontZ, Math.PI / 2));
    for (const wx of [-0.010, 0.010])
      g.add(box(0.003, 0.018, 0.006,
        new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.70 }),
        wx, mbusFrontY + 0.025, mbusFrontZ));

    // ── M203 under-barrel ────────────────────────────────────────────────────────
    const m203 = M203Weapon.build();
    m203.position.set(0, 0.022, -0.091);
    g.add(m203);

    // ── EOTech 553 ───────────────────────────────────────────────────────────────
    const eotech = buildEOTech();
    eotech.position.set(0, 0.055, 0.012);
    g.add(eotech);

    return g;
  }
}
