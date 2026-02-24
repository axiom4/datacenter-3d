import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildRifle, buildBeretta, buildKnife, buildHands } from './weapon-models';
import { HandsWeapon } from './weapons/hands-weapon';
import { SoundFX } from './sound-fx';

export class WeaponBuilder {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private weapons: THREE.Group[] = [];
  private weaponIndex = 0;
  private bobTime = 0;

  // Swap animation state
  private swapping = false;
  private swapPhase: 'lower' | 'raise' = 'lower';
  private swapT = 0;
  private nextWeaponIndex = 0;

  private static readonly CONFIGS = [
    {
      name: 'M4 CQB Tanker',
      restPos: new THREE.Vector3(0.17, -0.22, -0.38),
      restRot: new THREE.Euler(0.06, 0.14, 0.03),
    },
    {
      name: 'Beretta 92FS',
      restPos: new THREE.Vector3(0.14, -0.19, -0.32),
      restRot: new THREE.Euler(0.04, 0.22, 0.02),
    },
    {
      name: 'KA-BAR Combat',
      restPos: new THREE.Vector3(0.14, -0.20, -0.34),
      restRot: new THREE.Euler(0.08, 0.20, 0.05),
    },
    {
      name: '',   // mani nude — nessun nome HUD
      restPos: new THREE.Vector3(0.00, -0.22, -0.34),
      restRot: new THREE.Euler(0.10, 0.00, 0.00),
    },
  ];

  private lastWeaponIndex = 0;   // ricorda l'arma attiva prima di nasconderla

  // ── Attack animation state ──────────────────────────────────────────────
  private attacking = false;
  private attackPhase: 'forward' | 'back' = 'forward';
  private attackT = 0;
  private readonly FLASH_DURATION = 0.06;
  private muzzleFlashMesh: (THREE.Mesh | null)[] = [null, null];
  private muzzleFlashTime = 0;
  /** For hands combo: 0 = destro, 1 = sinistro — persiste tra i click, alterna ogni pugno */
  private hookStep = 0;

  // ── Particle pools ────────────────────────────────────────────
  private readonly bullets: Array<{
    mesh: THREE.Mesh; vel: THREE.Vector3; life: number; active: boolean;
  }> = [];
  private readonly smokes: Array<{
    mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number; active: boolean;
  }> = [];

  // Rest pose dei sub-gruppi mano (locali rispetto al gruppo armi全)
  private static readonly HAND_REST = [
    { pos: new THREE.Vector3( 0.095, -0.015,  0.000), rot: new THREE.Euler(0.10,  0.10,  0.06) },  // right
    { pos: new THREE.Vector3(-0.095, -0.020,  0.030), rot: new THREE.Euler(0.08, -0.10, -0.06) },  // left
  ];
  // Peak pose del gancio — rot.y ampio per far spuntare il gomito ad arco
  private static readonly HAND_HOOK = [
    { pos: new THREE.Vector3(-0.030, -0.005, -0.130), rot: new THREE.Euler(0.10,  0.85,  0.12) },  // right hook
    { pos: new THREE.Vector3( 0.030, -0.010, -0.125), rot: new THREE.Euler(0.08, -0.85, -0.12) },  // left hook
  ];

  get weaponName(): string {
    return WeaponBuilder.CONFIGS[this.weaponIndex].name;
  }

  /** Alterna tra mani nude e l'ultima arma equipaggiata. */
  toggleHands(): void {
    if (this.swapping) return;
    SoundFX.weaponSwap();
    const HANDS = WeaponBuilder.CONFIGS.length - 1;
    if (this.weaponIndex === HANDS) {
      // torna all'ultima arma
      this.swapping = true;
      this.swapPhase = 'lower';
      this.swapT = 0;
      this.nextWeaponIndex = this.lastWeaponIndex;
    } else {
      // nasconde arma e mostra mani
      this.lastWeaponIndex = this.weaponIndex;
      this.swapping = true;
      this.swapPhase = 'lower';
      this.swapT = 0;
      this.nextWeaponIndex = HANDS;
    }
  }

  /** Trigger attack / fire for the current weapon. */
  onFire(): void {
    if (this.swapping || this.attacking) return;
    this.attacking = true;
    this.attackPhase = 'forward';
    this.attackT = 0;
    // Muzzle flash for firearms
    if (this.weaponIndex <= 1) {
      const mesh = this.muzzleFlashMesh[this.weaponIndex];
      if (mesh) {
        (mesh.material as THREE.MeshStandardMaterial).opacity = 1;
        this.muzzleFlashTime = this.FLASH_DURATION;
      }
      this.spawnProjectileFX();
      // ── Sound ────────────────
      if (this.weaponIndex === 0) SoundFX.rifle();
      else                        SoundFX.pistol();
    }
    // Knife
    if (this.weaponIndex === 2) SoundFX.slash();
    // Per le mani: chiude il pugno, hookStep alterna da solo al termine dell'animazione
    if (this.weaponIndex === 3) {
      HandsWeapon.setFist(this.weapons[3], this.hookStep as 0 | 1, true);
    }
  }

  constructor(fov: number, aspect: number, renderer: THREE.WebGLRenderer) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.005, 10);

    // Environment map — IBL per riflessi PBR, intensità bassa per non sovrastare le luci colorate
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();

    // ── Lighting che replica l'atmosfera del datacenter ──────────────────────
    // Ambient molto basso, tinta blu scuro (come la stanza)
    this.scene.add(new THREE.AmbientLight(0x0a0f1a, 2.0));

    // Hemisfera: cielo blu datacenter / suolo quasi nero
    const hemi = new THREE.HemisphereLight(0x1a2a4a, 0x020202, 3.5);
    this.scene.add(hemi);

    // Overhead caldo — simula i fixture fluorescenti a soffitto
    const overhead = new THREE.DirectionalLight(0xffe8b0, 5.0);
    overhead.position.set(0.2, 2.0, 0.5);
    this.scene.add(overhead);

    // Rim dal basso-retro — bounce dal pavimento scuro
    const rimBot = new THREE.DirectionalLight(0x08091a, 1.2);
    rimBot.position.set(0, -1.0, -0.8);
    this.scene.add(rimBot);

    // Glow blu — simula i rack illuminati davanti al giocatore
    const blueRack = new THREE.PointLight(0x1144ff, 6.0, 4.0, 1.8);
    blueRack.position.set(-0.6, 0.3, -0.8);
    this.scene.add(blueRack);

    // Secondo blu-rack, lato opposto
    const blueRack2 = new THREE.PointLight(0x2255ff, 4.0, 3.5, 1.8);
    blueRack2.position.set(0.5, 0.1, -0.6);
    this.scene.add(blueRack2);

    // Emergenza rossa — simula le luci rosse di emergenza laterali
    const emergency = new THREE.PointLight(0xff1800, 3.5, 3.0, 2.0);
    emergency.position.set(0.4, -0.2, 0.6);
    this.scene.add(emergency);

    // Fill frontale tenue — garantisce leggibilità minima delle superfici frontali
    const frontFill = new THREE.DirectionalLight(0x2233aa, 2.5);
    frontFill.position.set(0, 0.1, 1.5);
    this.scene.add(frontFill);

    const rifle   = buildRifle();
    const beretta  = buildBeretta();
    const knife    = buildKnife();
    const hands    = buildHands();
    beretta.visible = false;
    knife.visible   = false;
    hands.visible   = false;
    this.weapons = [rifle, beretta, knife, hands];
    this.scene.add(rifle);
    this.scene.add(beretta);
    this.scene.add(knife);
    this.scene.add(hands);
    this.applyRestPose(0);
    this.applyRestPose(1);
    this.applyRestPose(2);
    this.applyRestPose(3);

    // ── Muzzle flash spheres (attached to firearms) ────────────────────────
    const flashMat = new THREE.MeshStandardMaterial({
      color: 0xffcc44, emissive: 0xffcc44, emissiveIntensity: 8,
      transparent: true, opacity: 0, depthWrite: false,
    });
    [
      { idx: 0, pos: new THREE.Vector3(0, 0.01, -0.22) },
      { idx: 1, pos: new THREE.Vector3(0, 0.02, -0.18) },
    ].forEach(({ idx, pos }) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), flashMat.clone());
      mesh.position.copy(pos);
      this.weapons[idx].add(mesh);
      this.muzzleFlashMesh[idx] = mesh;
    });
    // ── Bullet pool (8 proiettili) ───────────────────────────────────────
    const bulletGeo = new THREE.CylinderGeometry(0.002, 0.003, 0.022, 6);
    bulletGeo.rotateX(Math.PI / 2); // asse lungo Z
    const bulletMat = new THREE.MeshStandardMaterial({
      color: 0xb87333, emissive: 0x7a3b00, emissiveIntensity: 1.2,
      roughness: 0.25, metalness: 0.95,
    });
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(bulletGeo, bulletMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.bullets.push({ mesh, vel: new THREE.Vector3(), life: 0, active: false });
    }

    // ── Smoke pool (18 puffs) ────────────────────────────────────────
    const smokeGeo = new THREE.SphereGeometry(0.012, 7, 5);
    for (let i = 0; i < 18; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xddddcc,
        emissive: 0x888866, emissiveIntensity: 0.4,
        transparent: true, opacity: 0, depthWrite: false, side: THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(smokeGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.smokes.push({ mesh, vel: new THREE.Vector3(), life: 0, maxLife: 0, active: false });
    }
  }

  switchWeapon(): void {
    if (this.swapping) return;
    SoundFX.weaponSwap();
    this.swapping = true;
    this.swapPhase = 'lower';
    this.swapT = 0;
    // Cicla solo le armi (esclude le mani = ultimo slot)
    const HANDS = this.weapons.length - 1;
    const baseIdx = this.weaponIndex === HANDS ? this.lastWeaponIndex : this.weaponIndex;
    this.nextWeaponIndex = (baseIdx + 1) % HANDS;
  }

  update(delta: number, isMoving: boolean): void {
    if (this.swapping) {
      this.updateSwap(delta);
      return;
    }

    if (this.attacking) {
      this.updateAttack(delta);
      return;
    }

    const speed = isMoving ? 7.5 : 1.8;
    const ampX  = isMoving ? 0.014 : 0.003;
    const ampY  = isMoving ? 0.018 : 0.004;

    this.bobTime += delta * speed;

    const cfg  = WeaponBuilder.CONFIGS[this.weaponIndex];
    const bobX = Math.sin(this.bobTime) * ampX;
    const bobY = Math.abs(Math.sin(this.bobTime * 0.5)) * -ampY;

    this.weapons[this.weaponIndex].position.set(
      cfg.restPos.x + bobX,
      cfg.restPos.y + bobY,
      cfg.restPos.z,
    );

    this.updateFX(delta);
  }

  // ── FX helpers ───────────────────────────────────────────────────

  private spawnProjectileFX(): void {
    // Posizione bocca in world-space del weapon scene
    const flashMesh = this.muzzleFlashMesh[this.weaponIndex];
    if (!flashMesh) return;
    const muzzlePos = new THREE.Vector3();
    flashMesh.getWorldPosition(muzzlePos);

    // Direzione: la camera armi guarda lungo -Z, proiettile va in quella direzione
    const dir = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.camera.quaternion)
      .normalize();

    // — Proiettile —
    const bullet = this.bullets.find(b => !b.active);
    if (bullet) {
      bullet.mesh.position.copy(muzzlePos);
      bullet.mesh.lookAt(muzzlePos.clone().add(dir));
      bullet.vel.copy(dir).multiplyScalar(6.5);
      bullet.life = 1.2;
      bullet.active = true;
      bullet.mesh.visible = true;
    }

    // — Smoke puffs (4 per sparo) —
    let spawned = 0;
    for (const s of this.smokes) {
      if (s.active || spawned >= 5) continue;
      s.mesh.position.copy(muzzlePos);
      s.mesh.scale.setScalar(0.4 + Math.random() * 0.3);
      // velocità: avanti + dispersione radiale
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        Math.random() * 0.15,
        (Math.random() - 0.5) * 0.10,
      );
      s.vel.copy(dir).multiplyScalar(0.25 + Math.random() * 0.20).add(spread);
      const ml = 0.30 + Math.random() * 0.25;
      s.life = ml;
      s.maxLife = ml;
      s.active = true;
      s.mesh.visible = true;
      (s.mesh.material as THREE.MeshStandardMaterial).opacity = 0.55 + Math.random() * 0.20;
      spawned++;
    }
  }

  private updateFX(delta: number): void {
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.mesh.position.addScaledVector(b.vel, delta);
      b.life -= delta;
      if (b.life <= 0) {
        b.active = false;
        b.mesh.visible = false;
      }
    }
    for (const s of this.smokes) {
      if (!s.active) continue;
      s.mesh.position.addScaledVector(s.vel, delta);
      // rallenta nel tempo
      s.vel.multiplyScalar(1 - delta * 3.5);
      const ratio = s.life / s.maxLife;         // 1 -> 0
      // scale cresce, opacity cala
      const sc = 0.5 + (1 - ratio) * 2.2;
      s.mesh.scale.setScalar(sc);
      (s.mesh.material as THREE.MeshStandardMaterial).opacity = ratio * 0.65;
      s.life -= delta;
      if (s.life <= 0) {
        s.active = false;
        s.mesh.visible = false;
      }
    }
  }

  private updateAttack(delta: number): void {
    // Mani: usa animazione gancio dedicata sul sub-gruppo
    if (this.weaponIndex === 3) {
      this.updateHook(delta);
      return;
    }

    const cfg = WeaponBuilder.CONFIGS[this.weaponIndex];

    // Fade muzzle flash
    if (this.weaponIndex <= 1 && this.muzzleFlashTime > 0) {
      this.muzzleFlashTime -= delta;
      const mesh = this.muzzleFlashMesh[this.weaponIndex];
      if (mesh) {
        (mesh.material as THREE.MeshStandardMaterial).opacity =
          Math.max(0, this.muzzleFlashTime / this.FLASH_DURATION);
      }
    }

    const fwdDur = [0.05, 0.05, 0.10, 0.07][this.weaponIndex];
    const bakDur = [0.12, 0.12, 0.15, 0.09][this.weaponIndex];
    const dur = this.attackPhase === 'forward' ? fwdDur : bakDur;

    this.attackT += delta;
    const t = Math.min(this.attackT / dur, 1);
    const w = this.weapons[this.weaponIndex];

    if (this.attackPhase === 'forward') {
      const e = t * t; // ease-in
      switch (this.weaponIndex) {
        case 0: case 1: // firearms — recoil kick up+back
          w.position.set(cfg.restPos.x, cfg.restPos.y + e * 0.022, cfg.restPos.z + e * 0.06);
          w.rotation.set(cfg.restRot.x - e * 0.12, cfg.restRot.y, cfg.restRot.z);
          break;
        case 2: // knife — diagonal slash downward
          w.position.set(cfg.restPos.x, cfg.restPos.y - e * 0.06, cfg.restPos.z - e * 0.04);
          w.rotation.set(cfg.restRot.x + e * 0.60, cfg.restRot.y, cfg.restRot.z - e * 0.15);
          break;
      }
      if (t >= 1) { this.attackPhase = 'back'; this.attackT = 0; }
    } else {
      const e = 1 - (1 - t) * (1 - t); // ease-out back to rest
      switch (this.weaponIndex) {
        case 0: case 1:
          w.position.set(cfg.restPos.x, cfg.restPos.y + (1 - e) * 0.022, cfg.restPos.z + (1 - e) * 0.06);
          w.rotation.set(cfg.restRot.x - (1 - e) * 0.12, cfg.restRot.y, cfg.restRot.z);
          break;
        case 2:
          w.position.set(cfg.restPos.x, cfg.restPos.y - (1 - e) * 0.06, cfg.restPos.z - (1 - e) * 0.04);
          w.rotation.set(cfg.restRot.x + (1 - e) * 0.60, cfg.restRot.y, cfg.restRot.z - (1 - e) * 0.15);
          break;
      }
      if (t >= 1) {
        w.position.copy(cfg.restPos);
        w.rotation.copy(cfg.restRot);
        this.attacking = false;
        this.bobTime = 0;
      }
    }
  }

  /** Animazione gancio pugile: muove solo il sub-gruppo mano che colpisce. */
  private updateHook(delta: number): void {
    const idx  = this.hookStep as 0 | 1;
    const hand = this.weapons[3].children[idx] as THREE.Group;
    const rest = WeaponBuilder.HAND_REST[idx];
    const peak = WeaponBuilder.HAND_HOOK[idx];

    const fwdDur = 0.11;  // un po' più lento per vedere l'arco del gomito
    const bakDur = 0.14;
    const dur = this.attackPhase === 'forward' ? fwdDur : bakDur;
    this.attackT += delta;
    const t = Math.min(this.attackT / dur, 1);

    if (this.attackPhase === 'forward') {
      // Ease-in cubico: parte lento (gomito arco visibile) poi scatta sul colpo
      const e = t * t * t;
      hand.position.lerpVectors(rest.pos, peak.pos, e);
      hand.rotation.set(
        rest.rot.x + (peak.rot.x - rest.rot.x) * e,
        rest.rot.y + (peak.rot.y - rest.rot.y) * e,
        rest.rot.z + (peak.rot.z - rest.rot.z) * e,
      );
      if (t >= 1) {
        this.attackPhase = 'back'; this.attackT = 0;
        SoundFX.punch(); // suono di impatto al culmine del gancio
      }
    } else {
      // Ease-out: ritorno al rest
      const e = 1 - (1 - t) * (1 - t);
      hand.position.lerpVectors(peak.pos, rest.pos, e);
      hand.rotation.set(
        peak.rot.x + (rest.rot.x - peak.rot.x) * e,
        peak.rot.y + (rest.rot.y - peak.rot.y) * e,
        peak.rot.z + (rest.rot.z - peak.rot.z) * e,
      );
      if (t >= 1) {
        hand.position.copy(rest.pos);
        hand.rotation.copy(rest.rot);
        // Apri il pugno e alterna al braccio opposto per il prossimo click
        HandsWeapon.setFist(this.weapons[3], idx, false);
        this.hookStep = (this.hookStep === 0 ? 1 : 0);
        this.attacking = false;
        this.bobTime = 0;
      }
    }
  }

  private updateSwap(delta: number): void {
    const DURATION = 0.14;
    this.swapT += delta;
    const t = Math.min(this.swapT / DURATION, 1);

    if (this.swapPhase === 'lower') {
      // Ease-in: weapon drops quickly
      const eased = t * t;
      const cfg = WeaponBuilder.CONFIGS[this.weaponIndex];
      this.weapons[this.weaponIndex].position.set(
        cfg.restPos.x,
        cfg.restPos.y - eased * 0.42,
        cfg.restPos.z,
      );
      if (t >= 1) {
        this.weapons[this.weaponIndex].visible = false;
        this.weaponIndex = this.nextWeaponIndex;
        this.weapons[this.weaponIndex].visible = true;
        this.swapPhase = 'raise';
        this.swapT = 0;
        // Start new weapon from below
        const nCfg = WeaponBuilder.CONFIGS[this.weaponIndex];
        this.weapons[this.weaponIndex].position.set(nCfg.restPos.x, nCfg.restPos.y - 0.42, nCfg.restPos.z);
        this.weapons[this.weaponIndex].rotation.copy(nCfg.restRot);
      }
    } else {
      // Ease-out: weapon rises into rest position
      const eased = 1 - (1 - t) * (1 - t);
      const cfg = WeaponBuilder.CONFIGS[this.weaponIndex];
      this.weapons[this.weaponIndex].position.set(
        cfg.restPos.x,
        cfg.restPos.y - (1 - eased) * 0.42,
        cfg.restPos.z,
      );
      if (t >= 1) {
        this.weapons[this.weaponIndex].position.set(cfg.restPos.x, cfg.restPos.y, cfg.restPos.z);
        this.swapping = false;
        this.bobTime  = 0;
      }
    }
  }

  updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  private applyRestPose(index: number): void {
    const cfg = WeaponBuilder.CONFIGS[index];
    this.weapons[index].position.copy(cfg.restPos);
    this.weapons[index].rotation.copy(cfg.restRot);
  }
}

