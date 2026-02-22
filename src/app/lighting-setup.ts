import * as THREE from 'three';
import { ROOM_SIZE, WALL_HEIGHT } from './constants';

// ─── Shared lamp geometries/materials (created once for all fixtures) ───────
const housingGeo = new THREE.BoxGeometry(0.5, 0.1, 2.6);
const panelGeo = new THREE.BoxGeometry(0.4, 0.05, 2.4);
const cableGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2);
const housingMat = new THREE.MeshStandardMaterial({
  color: 0x333333,
  roughness: 0.5,
  metalness: 0.7,
});
const panelMat = new THREE.MeshBasicMaterial({ color: 0xfff5e8 });
const cableMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

// ─────────────────────────────────────────────────────────────────────────────

export function setupLighting(scene: THREE.Scene): void {
  // Ambient — cool-blue datacenter tint
  scene.add(new THREE.AmbientLight(0x334466, 1.5));

  // Hemisphere — sky/ground gradient
  const hemi = new THREE.HemisphereLight(0x1a2a4a, 0x080808, 10.8);
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
  shadowLight.shadow.camera.left = -ROOM_SIZE / 2;
  shadowLight.shadow.camera.right = ROOM_SIZE / 2;
  shadowLight.shadow.camera.top = ROOM_SIZE / 2;
  shadowLight.shadow.camera.bottom = -ROOM_SIZE / 2;
  shadowLight.shadow.bias = -0.0005;
  shadowLight.shadow.radius = 4;
  scene.add(shadowLight, shadowLight.target);

  // Subtle blue glow from each rack row
  for (const rx of [-4.55, -1.45, 1.45, 4.55]) {
    const glow = new THREE.PointLight(0x0044cc, 0.4, 6, 2);
    glow.position.set(rx, 1.2, 0);
    scene.add(glow);
  }

  // Single centre row of blue ceiling lights
  for (let cz = -8; cz <= 8; cz += 4) {
    const light = new THREE.PointLight(0x2255ff, 40.0, 16, 1.5);
    light.position.set(0, WALL_HEIGHT - 0.1, cz);
    scene.add(light);
  }

  addOverheadFixtures(scene);
}

// ─── Internal ────────────────────────────────────────────────────────────────

function addOverheadFixtures(scene: THREE.Scene): void {
  for (const xPos of [-3, 0, 3]) {
    for (let z = -9; z <= 9; z += 3) {
      scene.add(buildLampGroup(xPos, z));

      // SpotLight every 6 m — halves fragment-shader light cost while keeping full coverage
      if (Math.abs(z % 6) < 0.01 || Math.abs((z % 6) - 6) < 0.01) {
        const spot = new THREE.SpotLight(0xfff4e0, 5.6);
        spot.position.set(xPos, 3.7, z);
        spot.target.position.set(xPos, 0, z);
        spot.angle = Math.PI / 4.0;
        spot.penumbra = 0.65;
        spot.decay = 0.0;
        spot.distance = 20.0;
        spot.castShadow = false;
        scene.add(spot, spot.target);
      }
    }
  }
}

function buildLampGroup(xPos: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(xPos, 3.8, z);

  group.add(new THREE.Mesh(housingGeo, housingMat));

  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.y = -0.05;
  group.add(panel);

  const c1 = new THREE.Mesh(cableGeo, cableMat);
  c1.position.set(0, 0.15, -1.0);
  const c2 = new THREE.Mesh(cableGeo, cableMat);
  c2.position.set(0, 0.15, 1.0);
  group.add(c1, c2);

  return group;
}
