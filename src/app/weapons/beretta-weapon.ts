import * as THREE from 'three';
import {
  _metalTex, _metalNorm,
  _railTex, _railNorm,
  _stippleTex, _stippleNorm,
} from '../weapon-textures';
import { box, cyl } from '../weapon-geometry';

export class BerettaWeapon {

  static build(): THREE.Group {
    const g = new THREE.Group();

    const matSlide = new THREE.MeshStandardMaterial({
      map: _metalTex, normalMap: _metalNorm,
      normalScale: new THREE.Vector2(0.9, 0.9),
      color: 0x111111, roughness: 0.26, metalness: 0.92,
    });
    const matFrame = new THREE.MeshStandardMaterial({
      map: _metalTex, normalMap: _metalNorm,
      normalScale: new THREE.Vector2(0.7, 0.7),
      color: 0x1a1a1a, roughness: 0.36, metalness: 0.84,
    });
    const matBrl = new THREE.MeshStandardMaterial({
      color: 0x0c0c0c, roughness: 0.14, metalness: 0.97,
    });
    const matGrip = new THREE.MeshStandardMaterial({
      map: _stippleTex, normalMap: _stippleNorm,
      normalScale: new THREE.Vector2(2.2, 2.2),
      color: 0x0d0d0d, roughness: 0.95, metalness: 0.01,
    });
    const matTrigger = new THREE.MeshStandardMaterial({
      color: 0x111111, roughness: 0.42, metalness: 0.86,
    });
    const matWhiteDot = new THREE.MeshStandardMaterial({
      color: 0xfafafa, emissive: 0xcccccc, emissiveIntensity: 0.5,
      roughness: 0.55, metalness: 0.0,
    });
    const matSerr = new THREE.MeshStandardMaterial({
      color: 0x060606, roughness: 0.55, metalness: 0.78,
    });
    const matRail = new THREE.MeshStandardMaterial({
      map: _railTex, normalMap: _railNorm,
      normalScale: new THREE.Vector2(1.2, 1.2),
      color: 0x1a1a1a, roughness: 0.42, metalness: 0.82,
    });
    const matBore = new THREE.MeshStandardMaterial({
      color: 0x020202, roughness: 1.0, metalness: 0.0,
    });

    // Frame / dust cover
    g.add(box(0.034, 0.015, 0.175, matFrame, 0, -0.003, -0.0325));
    g.add(box(0.034, 0.098, 0.068, matFrame, 0, -0.054, 0.032));
    g.add(box(0.034, 0.098, 0.006, matFrame, 0, -0.054, -0.008));
    g.add(box(0.030, 0.090, 0.006, matFrame, 0, -0.050, 0.070));

    // Trigger guard
    g.add(box(0.034, 0.006, 0.038, matFrame, 0, -0.012, -0.022));
    g.add(box(0.034, 0.020, 0.005, matFrame, 0, -0.022, -0.042));
    for (let i = 0; i < 4; i++)
      g.add(box(0.036, 0.003, 0.003, matSerr, 0, -0.013 - i * 0.004, -0.044));

    // Picatinny rail
    g.add(box(0.020, 0.005, 0.050, matRail, 0, -0.012, -0.050));

    // Slide (open-top design)
    g.add(box(0.034, 0.005, 0.190, matSlide, 0, 0.008, -0.035));
    g.add(box(0.004, 0.026, 0.190, matSlide, -0.015, 0.023, -0.035));
    g.add(box(0.004, 0.026, 0.190, matSlide,  0.015, 0.023, -0.035));
    g.add(box(0.034, 0.030, 0.022, matSlide, 0, 0.021, -0.119));
    g.add(box(0.034, 0.030, 0.057, matSlide, 0, 0.021, 0.0315));
    g.add(box(0.004, 0.003, 0.111, matSlide, -0.015, 0.035, -0.0445));
    g.add(box(0.004, 0.003, 0.111, matSlide,  0.015, 0.035, -0.0445));

    // Rear serrations
    for (let i = 0; i < 10; i++)
      g.add(box(0.036, 0.024, 0.002, matSerr, 0, 0.021, 0.008 + i * 0.004));

    // Front serrations
    for (let i = 0; i < 5; i++)
      g.add(box(0.036, 0.016, 0.002, matSerr, 0, 0.022, -0.106 + i * 0.004));

    // Barrel
    const brlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.010, 0.145, 20), matBrl);
    brlMesh.rotation.x = Math.PI / 2;
    brlMesh.position.set(0, 0.019, -0.058);
    g.add(brlMesh);

    const chamberMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.020, 18), matBrl);
    chamberMesh.rotation.x = Math.PI / 2;
    chamberMesh.position.set(0, 0.019, 0.010);
    g.add(chamberMesh);

    const crownMesh = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.003, 8, 18), matBrl);
    crownMesh.rotation.x = Math.PI / 2;
    crownMesh.position.set(0, 0.019, -0.131);
    g.add(crownMesh);

    const boreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.008, 14), matBore);
    boreMesh.rotation.x = Math.PI / 2;
    boreMesh.position.set(0, 0.019, -0.134);
    g.add(boreMesh);

    // Locking block
    g.add(box(0.028, 0.008, 0.018, matFrame, 0, 0.006, -0.010));

    // Hammer
    g.add(cyl(0.003, 0.003, 0.040, 8, matFrame, 0, 0.016, 0.042, 0, Math.PI / 2));
    const hamMesh = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.020, 0.010), matSlide);
    hamMesh.rotation.x = 0.28;
    hamMesh.position.set(0, 0.028, 0.046);
    g.add(hamMesh);
    g.add(cyl(0.009, 0.009, 0.040, 14, matFrame, 0, 0.022, 0.048, 0, Math.PI / 2));

    // Ambidextrous safety / decocker
    for (const sx of [-0.019, 0.019]) {
      g.add(box(0.005, 0.012, 0.024, matSlide, sx, 0.020, 0.020));
      g.add(box(0.005, 0.007, 0.014,
        new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.65, metalness: 0.72 }),
        sx, 0.016, 0.032));
    }

    // Slide catch + mag release
    g.add(box(0.005, 0.010, 0.026, matFrame, -0.021, -0.001, -0.010));
    g.add(cyl(0.007, 0.007, 0.006, 10, matFrame, -0.021, -0.013, -0.002, Math.PI / 2));

    // Trigger
    g.add(box(0.008, 0.016, 0.005, matTrigger, 0, -0.019, -0.018));
    g.add(box(0.008, 0.009, 0.009, matTrigger, 0, -0.013, -0.028));
    g.add(box(0.008, 0.009, 0.008, matTrigger, 0, -0.023, -0.024));

    // Grip panels + backstrap
    for (const sx of [-0.019, 0.019])
      g.add(box(0.004, 0.085, 0.058, matGrip, sx, -0.054, 0.030));
    g.add(box(0.026, 0.072, 0.005,
      new THREE.MeshStandardMaterial({
        map: _stippleTex, normalMap: _stippleNorm,
        normalScale: new THREE.Vector2(2.4, 2.4),
        color: 0x0e0e0e, roughness: 0.96, metalness: 0.01,
      }), 0, -0.048, 0.072));

    // Mag base pad
    g.add(box(0.030, 0.009, 0.060, matFrame, 0, -0.105, 0.030));

    // 3-dot sights
    g.add(box(0.005, 0.009, 0.004, matSlide, 0, 0.038, -0.122));
    g.add(cyl(0.0022, 0.0022, 0.003, 8, matWhiteDot, 0, 0.040, -0.121, Math.PI / 2));
    g.add(box(0.026, 0.007, 0.010, matSlide, 0, 0.038, 0.058));
    g.add(box(0.007, 0.006, 0.012,
      new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 1.0 }),
      0, 0.038, 0.059));
    g.add(cyl(0.0022, 0.0022, 0.003, 8, matWhiteDot, -0.009, 0.040, 0.063, Math.PI / 2));
    g.add(cyl(0.0022, 0.0022, 0.003, 8, matWhiteDot,  0.009, 0.040, 0.063, Math.PI / 2));

    return g;
  }
}
