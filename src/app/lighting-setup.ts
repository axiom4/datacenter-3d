import * as THREE from 'three';
import { ROOM_WIDTH, ROOM_DEPTH, WALL_HEIGHT } from './constants';

/**
 * LightingSetup — scene-level lights and overhead lamp fixtures.
 * All shared geometries/materials are static; call LightingSetup.setup(scene).
 */
export class LightingSetup {
  // ─── Shared lamp geometries/materials (created once for all fixtures) ─────
  static readonly housingGeo = new THREE.BoxGeometry(0.5, 0.1, 2.6);
  static readonly panelGeo = new THREE.BoxGeometry(0.4, 0.05, 2.4);
  static readonly cableGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2);
  static readonly housingMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.5,
    metalness: 0.7,
  });
  static readonly panelMat = new THREE.MeshBasicMaterial({ color: 0xfff5e8 });
  static readonly cableMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  // ─────────────────────────────────────────────────────────────────────────

  static setup(scene: THREE.Scene): void {
    // Ambient — very low, let spotlights define the space
    scene.add(new THREE.AmbientLight(0x1a2233, 0.5));

    // Hemisphere — subtle sky/ground gradient
    const hemi = new THREE.HemisphereLight(0x1a2a4a, 0x030303, 2.5);
    hemi.position.set(0, WALL_HEIGHT, 0);
    scene.add(hemi);

    // Single shadow-casting directional light
    const shadowLight = new THREE.DirectionalLight(0xffffff, 1.551025);
    shadowLight.position.set(8, WALL_HEIGHT, 6);
    shadowLight.target.position.set(0, 0, 0);
    shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.width = 1024;
    shadowLight.shadow.mapSize.height = 1024;
    shadowLight.shadow.camera.near = 0.5;
    shadowLight.shadow.camera.far = 50;
    shadowLight.shadow.camera.left = -ROOM_WIDTH / 2;
    shadowLight.shadow.camera.right = ROOM_WIDTH / 2;
    shadowLight.shadow.camera.top = ROOM_DEPTH / 2;
    shadowLight.shadow.camera.bottom = -ROOM_DEPTH / 2;
    shadowLight.shadow.bias = -0.0005;
    shadowLight.shadow.radius = 4;
    scene.add(shadowLight, shadowLight.target);

    // Blue glow from each rack row
    for (const rx of [-4.2, -1.8, 1.8, 4.2]) {
      const glow = new THREE.PointLight(0x0055ff, 0.8, 5, 1.8);
      glow.position.set(rx, 1.0, 0);
      scene.add(glow);
    }

    // Blue ceiling accent — one per lamp fixture
    for (const cx of [-6, -3, 0, 3, 6]) {
      for (const cz of [-3, 0, 3]) {
        const light = new THREE.PointLight(0x2255ff, 8.0, 12, 1.8);
        light.position.set(cx, WALL_HEIGHT - 0.15, cz);
        scene.add(light);
      }
    }

    // Red emergency lights near door — one per corridor
    for (const ex of [-3, 0, 3]) {
      const emergency = new THREE.PointLight(0xff1500, 3.5, 6, 2);
      emergency.position.set(ex, 2.8, -ROOM_DEPTH / 2 + 1.5);
      scene.add(emergency);
    }

    LightingSetup.addOverheadFixtures(scene);
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  private static addOverheadFixtures(scene: THREE.Scene): void {
    for (const xPos of [-6, -3, 0, 3, 6]) {
      for (let z = -3; z <= 3; z += 3) {
        scene.add(LightingSetup.buildLampGroup(xPos, z));

        const spot = new THREE.SpotLight(0xffe8c0, 7.0);
        spot.position.set(xPos, 3.7, z);
        spot.target.position.set(xPos, 0, z);
        spot.angle = Math.PI / 4.5;
        spot.penumbra = 0.8;
        spot.decay = 1.2;
        spot.distance = 12.0;
        spot.castShadow = false;
        scene.add(spot, spot.target);
      }
    }
  }

  private static buildLampGroup(xPos: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(xPos, 3.8, z);

    group.add(new THREE.Mesh(LightingSetup.housingGeo, LightingSetup.housingMat));

    const panel = new THREE.Mesh(LightingSetup.panelGeo, LightingSetup.panelMat);
    panel.position.y = -0.05;
    group.add(panel);

    const c1 = new THREE.Mesh(LightingSetup.cableGeo, LightingSetup.cableMat);
    c1.position.set(0, 0.15, -1.0);
    const c2 = new THREE.Mesh(LightingSetup.cableGeo, LightingSetup.cableMat);
    c2.position.set(0, 0.15, 1.0);
    group.add(c1, c2);

    return group;
  }
}

// ─── Backward-compat named export ────────────────────────────────────────────
export const setupLighting = (scene: THREE.Scene) => LightingSetup.setup(scene);
