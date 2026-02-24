import * as THREE from 'three';
import { U_HEIGHT, RACK_UNITS, RACK_WIDTH, RACK_DEPTH } from './constants';
import {
  createServerFaceMaterial,
  createServerRearMaterial,
  createRackFrameMaterial,
} from './texture-factory';

// ─────────────────────────────────────────────────────────────────────────────

export class DatacenterBuilder {
  /** LEDs that should blink every frame tick */
  readonly ledLights: THREE.Mesh[] = [];

  // ─── Shared materials ───────────────────────────────────────────────────
  private readonly serverMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.7,
    roughness: 0.4,
    side: THREE.FrontSide,
    shadowSide: THREE.BackSide,
  });
  private readonly faceMat = createServerFaceMaterial();
  private readonly rearMat = createServerRearMaterial();
  private readonly frameMat = createRackFrameMaterial();

  // ─── Shared LED materials ───────────────────────────────────────────────
  private readonly ledGeo = new THREE.PlaneGeometry(0.008, 0.008);
  private readonly ledGreen = new THREE.MeshBasicMaterial({ color: 0x00ff00, toneMapped: false });
  private readonly ledBlue = new THREE.MeshBasicMaterial({ color: 0x0088ff, toneMapped: false });
  private readonly ledAmber = new THREE.MeshBasicMaterial({ color: 0xffaa00, toneMapped: false });

  // ─── Lazy geometry caches ───────────────────────────────────────────────
  private frameGeo?: THREE.BoxGeometry;
  private topGeo?: THREE.BoxGeometry;
  private srvGeo1U?: THREE.BoxGeometry;
  private srvGeo2U?: THREE.BoxGeometry;
  private srvGeo4U?: THREE.BoxGeometry;
  private faceGeo1U?: THREE.BoxGeometry;
  private faceGeo2U?: THREE.BoxGeometry;
  private faceGeo4U?: THREE.BoxGeometry;

  // ─────────────────────────────────────────────────────────────────────────

  build(scene: THREE.Scene): void {
    const racksPerRow = 10;
    const spacing = 0.82; // 800mm rack + 20mm gap
    const aisleHalf = RACK_DEPTH / 2 + 0.6; // 0.6m half-depth + 0.6m cold-aisle half

    for (const aisleX of [-3, 3]) {
      for (let i = 0; i < racksPerRow; i++) {
        const z = i * spacing - (racksPerRow * spacing) / 2;
        this.buildRack(scene, aisleX - aisleHalf, z, -Math.PI / 2);
        this.buildRack(scene, aisleX + aisleHalf, z, Math.PI / 2);
      }
    }
  }

  // ─── Rack ─────────────────────────────────────────────────────────────────

  private buildRack(scene: THREE.Scene, x: number, z: number, rotY: number): void {
    const rackGroup = new THREE.Group();
    const frameH = RACK_UNITS * U_HEIGHT + 0.2;

    // Lazy-init shared frame geometries
    this.frameGeo ??= new THREE.BoxGeometry(0.02, frameH, RACK_DEPTH);
    this.topGeo ??= new THREE.BoxGeometry(RACK_WIDTH, 0.05, RACK_DEPTH);

    // Side panels
    for (const xOff of [-RACK_WIDTH / 2 + 0.01, RACK_WIDTH / 2 - 0.01]) {
      const panel = new THREE.Mesh(this.frameGeo, this.frameMat);
      panel.position.set(xOff, frameH / 2, 0);
      panel.receiveShadow = true;
      rackGroup.add(panel);
    }
    // Top panel — poggia sulla sommità dei montanti (y = frameH + metà spessore)
    const top = new THREE.Mesh(this.topGeo, this.frameMat);
    top.position.set(0, frameH + 0.025, 0);
    top.receiveShadow = true;
    rackGroup.add(top);

    this.populateRack(rackGroup, frameH);

    rackGroup.position.set(x, 0, z);
    rackGroup.rotation.y = rotY;
    scene.add(rackGroup);
  }

  // ─── Server population ────────────────────────────────────────────────────

  private populateRack(rack: THREE.Group, _frameH: number): void {
    const serverW = RACK_WIDTH - 0.05;
    const serverD = RACK_DEPTH - 0.1;
    let u = 0;

    while (u < RACK_UNITS) {
      if (Math.random() > 0.9) {
        u++;
        continue;
      } // empty slot

      const r = Math.random();
      let size = r > 0.9 ? 4 : r > 0.7 ? 2 : 1;
      if (u + size > RACK_UNITS) {
        size = 1;
        if (u + size > RACK_UNITS) break;
      }

      const h = size * U_HEIGHT - 0.002;
      const y = 0.1 + u * U_HEIGHT + h / 2;
      this.buildServerUnit(rack, serverW, h, serverD, y);
      u += size;
    }
  }

  private buildServerUnit(parent: THREE.Group, w: number, h: number, d: number, y: number): void {
    const group = new THREE.Group();

    // Chassis
    const chassis = new THREE.Mesh(this.getServerGeo(h, w, d), this.serverMat);
    chassis.receiveShadow = true;
    group.add(chassis);

    // Face / Rear
    const faceGeo = this.getFaceGeo(h, w);
    const face = new THREE.Mesh(faceGeo, this.faceMat);
    face.position.z = d / 2 + 0.01;
    const rear = new THREE.Mesh(faceGeo, this.rearMat);
    rear.rotation.y = Math.PI;
    rear.position.z = -d / 2 - 0.01;
    group.add(face, rear);

    this.addLEDs(group, w, h, d);

    group.position.set(0, y, 0);
    parent.add(group);
  }

  // ─── Shared geometry selectors ────────────────────────────────────────────

  private getServerGeo(h: number, w: number, d: number): THREE.BoxGeometry {
    if (h < 0.06) {
      this.srvGeo1U ??= new THREE.BoxGeometry(w, h, d);
      return this.srvGeo1U;
    }
    if (h < 0.12) {
      this.srvGeo2U ??= new THREE.BoxGeometry(w, h, d);
      return this.srvGeo2U;
    }
    this.srvGeo4U ??= new THREE.BoxGeometry(w, h, d);
    return this.srvGeo4U;
  }

  private getFaceGeo(h: number, w: number): THREE.BoxGeometry {
    if (h < 0.06) {
      this.faceGeo1U ??= new THREE.BoxGeometry(w + 0.002, h, 0.02);
      return this.faceGeo1U;
    }
    if (h < 0.12) {
      this.faceGeo2U ??= new THREE.BoxGeometry(w + 0.002, h, 0.02);
      return this.faceGeo2U;
    }
    this.faceGeo4U ??= new THREE.BoxGeometry(w + 0.002, h, 0.02);
    return this.faceGeo4U;
  }

  // ─── LED lights ───────────────────────────────────────────────────────────

  private addLEDs(group: THREE.Group, w: number, h: number, d: number): void {
    const scaleY = h / 128;
    const scaleX = w / 128;
    const yOff = 14 * scaleY;
    const rearGeo = new THREE.PlaneGeometry(0.015, 0.015);

    // Rear port LEDs
    for (const xOff of [-11 * scaleX, -31 * scaleX]) {
      if (Math.random() > 0.3) {
        const led = new THREE.Mesh(rearGeo, Math.random() > 0.5 ? this.ledGreen : this.ledAmber);
        led.rotation.y = Math.PI;
        led.position.set(xOff, yOff, -d / 2 - 0.04);
        this.ledLights.push(led);
        group.add(led);
      }
    }

    // Power LED (always on)
    const power = new THREE.Mesh(this.ledGeo, this.ledGreen);
    power.position.set(-w / 2 + 0.02, h / 2 - 0.015, d / 2 + 0.021);
    group.add(power);

    // Activity LEDs
    for (let i = 0; i < 3; i++) {
      const led = new THREE.Mesh(this.ledGeo, Math.random() > 0.7 ? this.ledAmber : this.ledBlue);
      led.position.set(w / 2 - 0.06 + i * 0.015, h / 2 - 0.015, d / 2 + 0.021);
      this.ledLights.push(led);
      group.add(led);
    }

    // Disk LEDs (2U / 4U only)
    if (h > 0.08) {
      for (let j = 0; j < 4; j++) {
        const led = new THREE.Mesh(this.ledGeo, this.ledBlue);
        led.position.set(-w / 2 + 0.06, -h / 2 + 0.03 + j * 0.015, d / 2 + 0.021);
        this.ledLights.push(led);
        group.add(led);
      }
    }
  }
}
