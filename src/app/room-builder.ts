import * as THREE from 'three';
import {
  ROOM_SIZE,
  WALL_HEIGHT,
  DOOR_FRAME_W,
  DOOR_FRAME_H,
  DOOR_FRAME_D,
  COLOR_DARK_GREY,
} from './constants';
import {
  createFloorTexture,
  createCeilingTexture,
  createWallTexture,
  createBrushedMetalTexture,
  createHazardStripeTexture,
  createExitSignTexture,
} from './texture-factory';

// ─────────────────────────────────────────────────────────────────────────────

export function buildRoom(scene: THREE.Scene, maxAnisotropy: number): void {
  buildFloor(scene, maxAnisotropy);
  buildCeiling(scene);
  buildWalls(scene);
  buildDoor(scene);
}

// ─── Floor ───────────────────────────────────────────────────────────────────

function buildFloor(scene: THREE.Scene, maxAnisotropy: number): void {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE),
    new THREE.MeshStandardMaterial({
      map: createFloorTexture(maxAnisotropy),
      roughness: 0.35,
      metalness: 0.25,
      envMapIntensity: 0.6,
      side: THREE.FrontSide,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// ─── Ceiling ─────────────────────────────────────────────────────────────────

function buildCeiling(scene: THREE.Scene): void {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE),
    new THREE.MeshStandardMaterial({
      map: createCeilingTexture(),
      color: 0xaaaaaa,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.FrontSide,
    }),
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = WALL_HEIGHT;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// ─── Walls ───────────────────────────────────────────────────────────────────

function buildWalls(scene: THREE.Scene): void {
  const wallGeo = new THREE.PlaneGeometry(ROOM_SIZE, WALL_HEIGHT);
  const wallMat = new THREE.MeshStandardMaterial({
    map: createWallTexture(),
    roughness: 0.85,
    metalness: 0.05,
    color: 0x555555,
    side: THREE.FrontSide,
  });

  const configs: { pos: [number, number, number]; rot: number }[] = [
    { pos: [0, WALL_HEIGHT / 2, -ROOM_SIZE / 2], rot: 0 }, // back
    { pos: [0, WALL_HEIGHT / 2, ROOM_SIZE / 2], rot: Math.PI }, // front
    { pos: [-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0], rot: Math.PI / 2 }, // left
    { pos: [ROOM_SIZE / 2, WALL_HEIGHT / 2, 0], rot: -Math.PI / 2 }, // right
  ];

  for (const { pos, rot } of configs) {
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(...pos);
    wall.rotation.y = rot;
    wall.receiveShadow = true;
    scene.add(wall);
  }
}

// ─── Door ────────────────────────────────────────────────────────────────────

function buildDoor(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.position.set(0, 0, -ROOM_SIZE / 2 + 0.11);

  // Frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_FRAME_W, DOOR_FRAME_H, DOOR_FRAME_D),
    new THREE.MeshStandardMaterial({ color: COLOR_DARK_GREY, side: THREE.FrontSide }),
  );
  frame.position.y = DOOR_FRAME_H / 2;
  frame.castShadow = frame.receiveShadow = true;
  group.add(frame);

  // Leaf group (offset so leaf front clears frame front)
  const leafGroup = new THREE.Group();
  leafGroup.position.z = 0.08;
  group.add(leafGroup);
  buildDoorLeaf(leafGroup);

  // EXIT sign
  const signTex = createExitSignTexture();
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.25, 0.05),
    new THREE.MeshStandardMaterial({
      map: signTex,
      emissiveMap: signTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
    }),
  );
  sign.position.set(0, DOOR_FRAME_H + 0.2, 0);
  group.add(sign);

  scene.add(group);
}

function buildDoorLeaf(parent: THREE.Group): void {
  const leafW = DOOR_FRAME_W - 0.2;
  const leafH = DOOR_FRAME_H - 0.2;
  const leafD = 0.1;
  const botH = 0.9;
  const topH = 0.4;
  const midH = leafH - botH - topH;
  const sideW = 0.2;

  const doorMat = new THREE.MeshStandardMaterial({
    map: createBrushedMetalTexture(),
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.4,
  });

  for (const cfg of [
    { w: leafW, h: botH, y: botH / 2, x: 0 },
    { w: leafW, h: topH, y: leafH - topH / 2, x: 0 },
    { w: sideW, h: midH, y: botH + midH / 2, x: -(leafW / 2 - sideW / 2) },
    { w: sideW, h: midH, y: botH + midH / 2, x: leafW / 2 - sideW / 2 },
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, leafD), doorMat);
    m.position.set(cfg.x, cfg.y, 0);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
  }

  // Window pane
  const winW = leafW - sideW * 2;
  const pane = new THREE.Mesh(
    new THREE.BoxGeometry(winW, midH, 0.02),
    new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      roughness: 0,
      transparent: true,
      opacity: 0.3,
      transmission: 0.9,
      thickness: 0.02,
    }),
  );
  pane.position.set(0, botH + midH / 2, 0);
  parent.add(pane);

  // Vertical bars
  const barMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const dir of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, midH), barMat);
    bar.position.set((dir * winW) / 6, botH + midH / 2, 0);
    parent.add(bar);
  }

  // Kickplate
  const kick = new THREE.Mesh(
    new THREE.BoxGeometry(leafW - 0.04, 0.2, leafD + 0.01),
    new THREE.MeshStandardMaterial({
      map: createHazardStripeTexture(),
      roughness: 0.8,
      color: 0xffffff,
    }),
  );
  kick.position.set(0, 0.15, 0);
  parent.add(kick);

  buildDoorHardware(parent, leafW, leafD);
}

function buildDoorHardware(parent: THREE.Group, leafW: number, leafD: number): void {
  // Handle
  const handleGroup = new THREE.Group();
  handleGroup.position.set(leafW / 2 - 0.15, 1.0, leafD / 2);
  handleGroup.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.15, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    ),
  );
  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 }),
  );
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 0, 0.06);
  handleGroup.add(bar);
  parent.add(handleGroup);

  // Keypad
  const keypadGroup = new THREE.Group();
  keypadGroup.position.set(leafW / 2 - 0.15, 1.25, leafD / 2);
  keypadGroup.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
    ),
  );
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.03, 0.025),
    new THREE.MeshBasicMaterial({ color: 0x003300 }),
  );
  screen.position.set(0, 0.025, 0);
  const statusLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.01, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  );
  statusLed.position.set(0.025, 0.025, 0);
  keypadGroup.add(screen, statusLed);
  parent.add(keypadGroup);
}
