/**
 * weapon-parts.ts
 * Tactical accessories and attachments:
 *   EOTech 553 · Trijicon ACOG TA31 · SureFire suppressor / scout light
 *   AN/PEQ-15 · Vertical forward grip · KAC RIS II quad-rail
 */
import * as THREE from 'three';
import {
  _metalTex, _metalNorm,
  matReceiver, matMetal, matGrip, matFDE, matMuzzle,
} from './weapon-textures';
import { box, cyl, lathe } from './weapon-geometry';

/**
 * WeaponParts — tactical accessories: sights, suppressors, laser devices, grips, rails.
 * Material constants and builder methods are static class members.
 */
export class WeaponParts {

  // ─── Optic / sight materials ──────────────────────────────────────────────────

  static readonly matACOG = new THREE.MeshStandardMaterial({
    map: _metalTex,
    normalMap: _metalNorm,
    normalScale: new THREE.Vector2(0.6, 0.6),
    color: 0x1a1a14,
    roughness: 0.30,
    metalness: 0.70,
  });

  static readonly matACOGRubber = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.97,
    metalness: 0.0,
  });

  static readonly matFiberGreen = new THREE.MeshStandardMaterial({
    color: 0x00ff44,
    emissive: 0x00bb22,
    emissiveIntensity: 1.4,
    roughness: 0.1,
    metalness: 0.0,
  });

  static readonly matLens = new THREE.MeshPhysicalMaterial({
    color: 0x001122,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.70,
    thickness: 0.008,
    ior: 1.52,
    opacity: 0.88,
    transparent: true,
  });

  static readonly matLensCoat = new THREE.MeshStandardMaterial({
    color: 0x2244cc,
    roughness: 0.0,
    metalness: 0.1,
    opacity: 0.30,
    transparent: true,
  });

  static readonly matEOTech = new THREE.MeshStandardMaterial({
    map: _metalTex,
    normalMap: _metalNorm,
    normalScale: new THREE.Vector2(0.5, 0.5),
    color: 0x111111,
    roughness: 0.45,
    metalness: 0.65,
  });

  static readonly matHoloGlass = new THREE.MeshPhysicalMaterial({
    color: 0x001a0a,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.82,
    thickness: 0.003,
    ior: 1.48,
    opacity: 0.92,
    transparent: true,
    side: THREE.DoubleSide,
  });

  static readonly matHoloCoat = new THREE.MeshStandardMaterial({
    color: 0x003322,
    emissive: 0x001a10,
    emissiveIntensity: 0.3,
    roughness: 0.0,
    metalness: 0.0,
    opacity: 0.22,
    transparent: true,
  });

  static readonly matEOTechRubber = new THREE.MeshStandardMaterial({
    color: 0x080808,
    roughness: 0.98,
    metalness: 0.0,
  });

  // ─── SOPMOD accessory materials ───────────────────────────────────────────────

  static readonly matSupp = new THREE.MeshStandardMaterial({
    map: _metalTex,
    normalMap: _metalNorm,
    normalScale: new THREE.Vector2(0.4, 0.4),
    color: 0x0d0d0d,
    roughness: 0.55,
    metalness: 0.80,
  });

  static readonly matSFGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffee88,
    emissive: 0xffcc44,
    emissiveIntensity: 0.6,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.5,
    transparent: true,
    opacity: 0.9,
  });

  static readonly matPEQ = new THREE.MeshStandardMaterial({
    color: 0x7a6840,
    roughness: 0.70,
    metalness: 0.12,
  });

  static readonly matLaserRed = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: 0xff1100,
    emissiveIntensity: 2.0,
    roughness: 0.1,
    metalness: 0.0,
  });

  // ─── EOTech 553 Holographic Sight ────────────────────────────────────────────

  static buildEOTech(): THREE.Group {
    const s = new THREE.Group();

    // Main housing body (89 mm × 37 mm × 28 mm)
    s.add(box(0.037, 0.028, 0.089, WeaponParts.matEOTech, 0, 0, 0));

    // Front hood / shroud
    s.add(box(0.037, 0.032, 0.020, WeaponParts.matEOTech,   0,  0.002, -0.055)); // top shroud
    s.add(box(0.037, 0.006, 0.020, WeaponParts.matEOTech,   0, -0.017, -0.055)); // bottom lip
    s.add(box(0.006, 0.032, 0.020, WeaponParts.matEOTech,   0.0155,  0.002, -0.055)); // L wall
    s.add(box(0.006, 0.032, 0.020, WeaponParts.matEOTech,  -0.0155,  0.002, -0.055)); // R wall

    // Holographic window (35 mm × 24 mm)
    s.add(box(0.035, 0.024, 0.002, WeaponParts.matHoloGlass,  0, 0.001,  -0.022)); // front glass
    s.add(box(0.035, 0.024, 0.002, WeaponParts.matHoloCoat,   0, 0.001,  -0.020)); // reticle film front
    s.add(box(0.035, 0.024, 0.002, WeaponParts.matHoloGlass,  0, 0.001,   0.018)); // rear glass
    s.add(box(0.035, 0.024, 0.002, WeaponParts.matHoloCoat,   0, 0.001,   0.016)); // reticle film rear
    // Window frame
    s.add(box(0.041, 0.004, 0.040, matReceiver,   0,  0.015,  -0.002)); // top bar
    s.add(box(0.041, 0.004, 0.040, matReceiver,   0, -0.013,  -0.002)); // bottom bar
    s.add(box(0.004, 0.028, 0.040, matReceiver,   0.0205, 0.001, -0.002)); // left
    s.add(box(0.004, 0.028, 0.040, matReceiver,  -0.0205, 0.001, -0.002)); // right

    // Rear aperture / eyepiece ring
    s.add(box(0.041, 0.032, 0.008, WeaponParts.matEOTech,      0, 0.001,  0.048));
    s.add(box(0.026, 0.018, 0.004, WeaponParts.matHoloGlass,   0, 0.001,  0.053));
    s.add(box(0.043, 0.034, 0.006, WeaponParts.matEOTechRubber, 0, 0.001,  0.047));

    // Controls (right side) — 3 push buttons
    for (let i = 0; i < 3; i++) {
      s.add(cyl(0.004, 0.004, 0.008, 10, WeaponParts.matEOTechRubber,
        -0.0225, -0.004, 0.018 + i * 0.014, 0, 0, Math.PI / 2));
      s.add(cyl(0.003, 0.003, 0.002, 10, matMuzzle,
        -0.0285, -0.004, 0.018 + i * 0.014, 0, 0, Math.PI / 2));
    }
    // NV button (separate, left)
    s.add(cyl(0.004, 0.004, 0.008, 10, WeaponParts.matEOTechRubber,
      0.0225, -0.004, 0.018, 0, 0, Math.PI / 2));

    // Battery cap (CR123 side-loading)
    s.add(box(0.012, 0.024, 0.022, WeaponParts.matEOTech,  0.0245, -0.001, -0.028));
    s.add(cyl(0.005, 0.005, 0.015, 10, matMuzzle, 0.030, -0.001, -0.028, 0, 0, Math.PI / 2));

    // Picatinny QD mount (1-piece)
    s.add(box(0.044, 0.012, 0.088, matMetal,   0, -0.020,  0.000)); // base plate
    s.add(box(0.044, 0.016, 0.014, matMetal,   0, -0.022, -0.040)); // front clamp
    s.add(box(0.044, 0.016, 0.014, matMetal,   0, -0.022,  0.038)); // rear clamp
    s.add(box(0.014, 0.012, 0.022, WeaponParts.matEOTech,  0.026, -0.022, 0.038)); // lever knob
    for (let i = 0; i < 4; i++)
      s.add(box(0.042, 0.005, 0.010, matReceiver, 0, -0.030, -0.033 + i * 0.022));

    return s;
  }

  // ─── Trijicon ACOG TA31 (4×32) ───────────────────────────────────────────────

  static buildACOG(): THREE.Group {
    const s = new THREE.Group();

    s.add(box(0.040, 0.038, 0.092, WeaponParts.matACOG, 0, 0, 0));
    s.add(box(0.038, 0.006, 0.040, WeaponParts.matACOG, 0, -0.022, -0.026)); // taper

    // Front objective (32 mm)
    s.add(cyl(0.018, 0.020, 0.006, 14, WeaponParts.matACOG,     0, 0, -0.049, Math.PI / 2));
    s.add(cyl(0.017, 0.017, 0.004, 14, WeaponParts.matLens,     0, 0, -0.053, Math.PI / 2));
    s.add(cyl(0.017, 0.017, 0.003, 14, WeaponParts.matLensCoat, 0, 0, -0.052, Math.PI / 2));

    // Rear ocular
    s.add(cyl(0.018, 0.016, 0.006, 14, WeaponParts.matACOG,       0, 0,  0.049, Math.PI / 2));
    s.add(cyl(0.019, 0.019, 0.010, 14, WeaponParts.matACOGRubber,  0, 0,  0.057, Math.PI / 2));
    s.add(cyl(0.015, 0.015, 0.004, 14, WeaponParts.matLens,        0, 0,  0.064, Math.PI / 2));
    s.add(cyl(0.015, 0.015, 0.003, 14, WeaponParts.matLensCoat,    0, 0,  0.063, Math.PI / 2));

    // Top fiber optic housing
    s.add(box(0.010, 0.008, 0.076, WeaponParts.matACOG, 0, 0.023, 0.000));
    s.add(cyl(0.002, 0.002, 0.060, 8, WeaponParts.matFiberGreen, 0, 0.027, 0.000, Math.PI / 2));

    // BDC elevation strip
    s.add(box(0.008, 0.005, 0.050, matMuzzle, 0, 0.022, -0.005));

    // LaRue LT100 QD mount
    s.add(box(0.044, 0.010, 0.084, matMetal,    0, -0.024,  0.000));
    s.add(box(0.044, 0.016, 0.012, matMetal,    0, -0.026, -0.042));
    s.add(box(0.028, 0.010, 0.012, matReceiver, 0, -0.034, -0.042));
    s.add(box(0.044, 0.016, 0.012, matMetal,    0, -0.026,  0.042));
    s.add(box(0.028, 0.010, 0.012, matReceiver, 0, -0.034,  0.042));
    s.add(box(0.006, 0.012, 0.022, WeaponParts.matACOG,     0.026, -0.026, 0.042));

    return s;
  }

  // ─── SureFire SOCOM762-RC2 Suppressor ────────────────────────────────────────

  static buildSuppressor(): THREE.Group {
    const s = new THREE.Group();

    s.add(lathe([
      [0.016,  -0.0825],
      [0.0185, -0.0785],
      [0.0185, -0.070 ],
      [0.0185,  0.050 ],
      [0.0185,  0.058 ],
      [0.020,   0.062 ],
      [0.020,   0.075 ],
      [0.018,   0.0785],
      [0.018,   0.0825],
      [0.010,   0.0825],
      [0.010,  -0.0825],
    ], 24, WeaponParts.matSupp, 0, 0, 0));

    for (const kz of [-0.055, 0.000, 0.055])
      s.add(cyl(0.0195, 0.0195, 0.005, 24, matReceiver, 0, 0, kz, Math.PI / 2));

    s.add(cyl(0.0215, 0.0215, 0.022, 24, matMetal, 0, 0, 0.086, Math.PI / 2));
    s.add(cyl(0.0200, 0.0215, 0.006, 24, matMetal, 0, 0, 0.097, Math.PI / 2));

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const vb = box(0.004, 0.005, 0.028, matReceiver,
        Math.cos(a) * 0.019, Math.sin(a) * 0.019, 0.010);
      vb.rotation.z = a;
      s.add(vb);
    }
    return s;
  }

  // ─── AN/PEQ-15 ATPIAL ────────────────────────────────────────────────────────

  static buildPEQ15(): THREE.Group {
    const p = new THREE.Group();

    p.add(box(0.032, 0.026, 0.072, WeaponParts.matPEQ));

    p.add(box(0.030, 0.024, 0.002,
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.6 }),
      0, 0, -0.037));

    p.add(box(0.012, 0.010, 0.003,
      new THREE.MeshStandardMaterial({
        color: 0x220022, roughness: 0.0, metalness: 0.0, transparent: true, opacity: 0.7,
      }), -0.006, 0.004, -0.038));

    p.add(box(0.006, 0.006, 0.003, WeaponParts.matLaserRed,  0.009, 0.004, -0.038));
    p.add(cyl(0.002, 0.002, 0.003, 8, WeaponParts.matLaserRed, 0.009, 0.004, -0.040, Math.PI / 2));

    p.add(cyl(0.012, 0.012, 0.008, 6, matMetal,   0, 0, 0.040, Math.PI / 2));
    p.add(cyl(0.006, 0.006, 0.008, 12, matMuzzle, 0.020, 0.004, 0.010, 0, 0, Math.PI / 2));
    p.add(cyl(0.004, 0.004, 0.010, 8, matMetal,   0, 0.017, -0.010, 0));
    p.add(cyl(0.004, 0.004, 0.010, 8, matMetal,   0.020, 0.004, -0.010, 0, 0, Math.PI / 2));

    p.add(box(0.036, 0.008, 0.068, matMetal, 0, -0.017, 0));
    for (let i = 0; i < 3; i++)
      p.add(box(0.034, 0.004, 0.010, matReceiver, 0, -0.023, -0.022 + i * 0.022));

    return p;
  }

  // ─── SureFire M600C Scout Light ───────────────────────────────────────────────

  static buildScoutLight(): THREE.Group {
    const l = new THREE.Group();

    l.add(lathe([
      [0.011,  -0.045],
      [0.012,  -0.040],
      [0.012,   0.028],
      [0.013,   0.033],
      [0.016,   0.040],
      [0.018,   0.047],
      [0.017,   0.050],
      [0.015,   0.053],
      [0.000,   0.053],
      [0.000,  -0.045],
    ], 20, matMuzzle, 0, 0, 0));

    l.add(cyl(0.014, 0.014, 0.004, 20, WeaponParts.matSFGlass, 0, 0, -0.054, Math.PI / 2));

    for (const kz of [-0.030, -0.015, 0.005, 0.018])
      l.add(cyl(0.0125, 0.0125, 0.004, 20, matReceiver, 0, 0, kz, Math.PI / 2));

    l.add(cyl(0.007, 0.007, 0.006, 12, WeaponParts.matACOGRubber, 0, 0, 0.050, Math.PI / 2));
    l.add(box(0.032, 0.010, 0.054, matMetal,    0, -0.023, 0));
    l.add(box(0.028, 0.005, 0.050, matReceiver, 0, -0.030, 0));
    l.add(cyl(0.003, 0.003, 0.016, 6, WeaponParts.matACOGRubber, -0.014, -0.018, 0.038, 0, 0, Math.PI / 4));

    return l;
  }

  // ─── Vertical Forward Grip ────────────────────────────────────────────────────

  static buildVFG(): THREE.Group {
    const v = new THREE.Group();

    v.add(lathe([
      [0.000, -0.072],
      [0.008, -0.065],
      [0.013, -0.045],
      [0.013,  0.000],
      [0.010,  0.010],
      [0.000,  0.010],
      [0.000, -0.072],
    ], 16, matFDE, 0, 0, 0));

    v.add(cyl(0.015, 0.015, 0.018, 16, matGrip,    0, 0.014, 0, Math.PI / 2));
    v.add(box(0.032, 0.010, 0.040, matMetal,        0, 0.005, 0));
    v.add(box(0.028, 0.005, 0.036, matReceiver,     0, 0.001, 0));
    v.add(cyl(0.003, 0.003, 0.030, 8, matMetal,     0.018, 0.010, 0, 0, 0, Math.PI / 2));

    return v;
  }

  // ─── KAC RIS II Quad-Rail ─────────────────────────────────────────────────────

  static buildKACRail(length: number): THREE.Group {
    const r = new THREE.Group();

    const faceData = [
      { ox:  0,      oy:  0.026, rz: 0           }, // top
      { ox:  0,      oy: -0.026, rz: Math.PI     }, // bottom
      { ox:  0.026,  oy:  0,     rz: -Math.PI / 2}, // right
      { ox: -0.026,  oy:  0,     rz:  Math.PI / 2}, // left
    ];

    for (const { ox, oy, rz } of faceData) {
      const face = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.004, length),
        matMetal,
      );
      face.position.set(ox, oy, 0);
      face.rotation.z = rz;
      r.add(face);

      const teeth = Math.floor(length / 0.020);
      for (let t = 0; t < teeth; t++) {
        const tz = -length / 2 + 0.008 + t * 0.020;
        const tooth = new THREE.Mesh(
          new THREE.BoxGeometry(0.040, 0.008, 0.010),
          matReceiver,
        );
        tooth.position.set(ox, oy, tz);
        tooth.rotation.z = rz;
        r.add(tooth);
      }
    }

    const walls = Math.ceil(length / 0.050);
    for (let w = 0; w <= walls; w++) {
      const wz = -length / 2 + w * (length / walls);
      r.add(box(0.048, 0.048, 0.003, matMetal, 0, 0, wz));
    }

    r.add(cyl(0.020, 0.020, length, 20, matReceiver, 0, 0, 0, Math.PI / 2));

    return r;
  }

}

// ─── Backward-compat named exports ─────────────────────────────────────────────────────────────────────────────────────
export const matACOG = WeaponParts.matACOG;
export const matACOGRubber = WeaponParts.matACOGRubber;
export const matFiberGreen = WeaponParts.matFiberGreen;
export const matLens = WeaponParts.matLens;
export const matLensCoat = WeaponParts.matLensCoat;
export const matEOTech = WeaponParts.matEOTech;
export const matHoloGlass = WeaponParts.matHoloGlass;
export const matHoloCoat = WeaponParts.matHoloCoat;
export const matEOTechRubber = WeaponParts.matEOTechRubber;
export const matSupp = WeaponParts.matSupp;
export const matSFGlass = WeaponParts.matSFGlass;
export const matPEQ = WeaponParts.matPEQ;
export const matLaserRed = WeaponParts.matLaserRed;
export const buildEOTech = (...args: Parameters<typeof WeaponParts.buildEOTech>) => WeaponParts.buildEOTech(...args);
export const buildACOG = (...args: Parameters<typeof WeaponParts.buildACOG>) => WeaponParts.buildACOG(...args);
export const buildSuppressor = (...args: Parameters<typeof WeaponParts.buildSuppressor>) => WeaponParts.buildSuppressor(...args);
export const buildPEQ15 = (...args: Parameters<typeof WeaponParts.buildPEQ15>) => WeaponParts.buildPEQ15(...args);
export const buildScoutLight = (...args: Parameters<typeof WeaponParts.buildScoutLight>) => WeaponParts.buildScoutLight(...args);
export const buildVFG = (...args: Parameters<typeof WeaponParts.buildVFG>) => WeaponParts.buildVFG(...args);
export const buildKACRail = (...args: Parameters<typeof WeaponParts.buildKACRail>) => WeaponParts.buildKACRail(...args);
