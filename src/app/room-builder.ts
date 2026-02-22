import * as THREE from 'three';
import {
  ROOM_WIDTH,
  ROOM_DEPTH,
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
    new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
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
    new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
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
  const wallMat = new THREE.MeshStandardMaterial({
    map: createWallTexture(),
    roughness: 0.85,
    metalness: 0.05,
    color: 0x555555,
    side: THREE.FrontSide,
  });

  // Back/front walls span ROOM_WIDTH (X axis)
  const wideGeo = new THREE.PlaneGeometry(ROOM_WIDTH, WALL_HEIGHT);
  // Left/right walls span ROOM_DEPTH (Z axis)
  const deepGeo = new THREE.PlaneGeometry(ROOM_DEPTH, WALL_HEIGHT);

  const configs: { pos: [number, number, number]; rot: number; geo: THREE.PlaneGeometry }[] = [
    { pos: [0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2], rot: 0,            geo: wideGeo }, // back
    { pos: [0, WALL_HEIGHT / 2,  ROOM_DEPTH / 2], rot: Math.PI,      geo: wideGeo }, // front
    { pos: [-ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0], rot: Math.PI / 2,  geo: deepGeo }, // left
    { pos: [ ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0], rot: -Math.PI / 2, geo: deepGeo }, // right
  ];

  for (const { pos, rot, geo } of configs) {
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(...pos);
    wall.rotation.y = rot;
    wall.receiveShadow = true;
    scene.add(wall);
  }
}

// ─── Door ────────────────────────────────────────────────────────────────────

function buildDoor(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.position.set(0, 0, -ROOM_DEPTH / 2 + 0.11);

  // Frame (single box)
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_FRAME_W, DOOR_FRAME_H, DOOR_FRAME_D),
    new THREE.MeshStandardMaterial({ color: COLOR_DARK_GREY, side: THREE.FrontSide }),
  );
  frame.position.y = DOOR_FRAME_H / 2;
  frame.receiveShadow = true;
  group.add(frame);

  // Leaf – single slab with brushed metal
  const leafW = DOOR_FRAME_W - 0.2;
  const leafH = DOOR_FRAME_H - 0.2;
  const leafD = 0.08;
  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(leafW, leafH, leafD),
    new THREE.MeshStandardMaterial({
      map: createBrushedMetalTexture(),
      metalness: 0.6,
      roughness: 0.4,
    }),
  );
  leaf.position.set(0, leafH / 2, 0.09);
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  group.add(leaf);

  // Window pane (cheap standard material instead of MeshPhysical)
  const winW = leafW * 0.55;
  const winH = leafH * 0.4;
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
    }),
  );
  pane.position.set(0, leafH * 0.62, 0.135);
  group.add(pane);

  // Handle – single box
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.12, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.2 }),
  );
  handle.position.set(leafW / 2 - 0.12, leafH * 0.42, 0.14);
  group.add(handle);

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
