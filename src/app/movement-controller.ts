import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import {
  ROOM_WIDTH,
  ROOM_DEPTH,
  PLAYER_EYE_HEIGHT,
  PLAYER_SPEED_MAX,
  PLAYER_ACCELERATION,
  PLAYER_FRICTION,
  PLAYER_BOUNDARY_MARGIN,
} from './constants';

// ─── Rack collision geometry ────────────────────────────────────────────────
// Layout: 4 file ±4.2 / ±1.8 su X. Rack ruotati 90°: depth 1.2m → X, width 0.8m → Z.
// Spaziatura Z 0.82m, 10 rack/fila: z₀=−4.10, z₉=+3.28.
const RACK_ROW_CENTERS_X = [-4.2, -1.8, 1.8, 4.2];
const COLLISION_PADDING = 0.3;
const RACK_HALF_W = (1.2 + COLLISION_PADDING * 2) / 2; // semi-estensione mondo-X = 0.9m

// Rack ±0.4m lungo Z dal centro + padding.
const RACK_Z_MIN = -4.1 - 0.4 - COLLISION_PADDING; // ≈ -4.80
const RACK_Z_MAX = 3.28 + 0.4 + COLLISION_PADDING; // ≈ +3.98
const BOUNDARY_X = ROOM_WIDTH / 2 - PLAYER_BOUNDARY_MARGIN;
const BOUNDARY_Z = ROOM_DEPTH / 2 - PLAYER_BOUNDARY_MARGIN;

// ─── Key → action map ───────────────────────────────────────────────────────
const KEY_MAP: Record<string, 'forward' | 'backward' | 'left' | 'right'> = {
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'backward',
  KeyS: 'backward',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

// ─────────────────────────────────────────────────────────────────────────────

export class MovementController {
  private forward = false;
  private backward = false;
  private left = false;
  private right = false;

  private vForward = 0;
  private vRight = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly controls: PointerLockControls,
  ) {}

  get isMoving(): boolean {
    return Math.abs(this.vForward) > 0.1 || Math.abs(this.vRight) > 0.1;
  }

  onKeyChange(code: string, pressed: boolean): void {
    switch (KEY_MAP[code]) {
      case 'forward':
        this.forward = pressed;
        break;
      case 'backward':
        this.backward = pressed;
        break;
      case 'left':
        this.left = pressed;
        break;
      case 'right':
        this.right = pressed;
        break;
    }
  }

  update(delta: number): void {
    const accel = PLAYER_ACCELERATION * delta;
    const fric = PLAYER_FRICTION * delta;

    // Accelerate
    if (this.forward) this.vForward = Math.min(this.vForward + accel, PLAYER_SPEED_MAX);
    if (this.backward) this.vForward = Math.max(this.vForward - accel, -PLAYER_SPEED_MAX);
    if (this.right) this.vRight = Math.min(this.vRight + accel, PLAYER_SPEED_MAX);
    if (this.left) this.vRight = Math.max(this.vRight - accel, -PLAYER_SPEED_MAX);

    // Friction
    if (!this.forward && !this.backward) this.vForward = this.decel(this.vForward, fric);
    if (!this.right && !this.left) this.vRight = this.decel(this.vRight, fric);

    // Move
    const oldX = this.camera.position.x;
    const oldZ = this.camera.position.z;
    this.controls.moveForward(this.vForward * delta);
    this.controls.moveRight(this.vRight * delta);
    const newX = this.camera.position.x;
    const newZ = this.camera.position.z;

    // Sliding collision
    if (this.collides(newX, newZ)) {
      if (!this.collides(oldX, newZ)) {
        this.camera.position.x = oldX; // slide along Z
      } else if (!this.collides(newX, oldZ)) {
        this.camera.position.z = oldZ; // slide along X
      } else {
        this.camera.position.x = oldX; // fully blocked
        this.camera.position.z = oldZ;
        this.vForward = 0;
        this.vRight = 0;
      }
    }

    this.clamp();
    this.camera.position.y = PLAYER_EYE_HEIGHT;
  }

  private decel(v: number, fric: number): number {
    if (v > 0) return Math.max(v - fric, 0);
    if (v < 0) return Math.min(v + fric, 0);
    return 0;
  }

  private collides(x: number, z: number): boolean {
    if (z < RACK_Z_MIN || z > RACK_Z_MAX) return false;
    return RACK_ROW_CENTERS_X.some((cx) => x > cx - RACK_HALF_W && x < cx + RACK_HALF_W);
  }

  private clamp(): void {
    const p = this.camera.position;
    p.x = Math.max(-BOUNDARY_X, Math.min(BOUNDARY_X, p.x));
    p.z = Math.max(-BOUNDARY_Z, Math.min(BOUNDARY_Z, p.z));
  }
}
