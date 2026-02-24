import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import { setupLighting } from './lighting-setup';
import { buildRoom } from './room-builder';
import { DatacenterBuilder } from './datacenter-builder';
import { MovementController } from './movement-controller';
import { WeaponBuilder } from './weapon-builder';
import { SoundFX } from './sound-fx';

@Component({
  selector: 'app-root',
  template: `
    <canvas #canvas class="three-canvas"></canvas>
    <div class="crosshair"></div>
    <div class="fps-counter">{{ fps }} FPS</div>
    <div class="weapon-name">{{ weaponName }}</div>
    <div class="weapon-hint">[Click] Spara/Attacca &nbsp;|&nbsp; [Q] Cambia arma &nbsp;|&nbsp; [H] Nascondi arma &nbsp;|&nbsp; [F] Fullscreen</div>
  `,
  styles: [
    `
      canvas.three-canvas {
        width: 100%;
        height: 100vh;
        display: block;
      }
      .fps-counter {
        position: fixed;
        top: 12px;
        right: 16px;
        color: #00ff88;
        font:
          bold 14px/1 'Courier New',
          monospace;
        background: rgba(0, 0, 0, 0.55);
        padding: 4px 10px;
        border-radius: 4px;
        pointer-events: none;
        z-index: 100;
      }
      .weapon-name {
        position: fixed;
        bottom: 36px;
        left: 50%;
        transform: translateX(-50%);
        color: #e8e0cc;
        font: bold 13px/1 'Courier New', monospace;
        text-transform: uppercase;
        letter-spacing: 3px;
        background: rgba(0, 0, 0, 0.60);
        padding: 5px 16px;
        border-radius: 3px;
        pointer-events: none;
        z-index: 100;
        border-left: 2px solid #ff4400;
        border-right: 2px solid #ff4400;
      }
      .weapon-hint {
        position: fixed;
        bottom: 14px;
        left: 50%;
        transform: translateX(-50%);
        color: rgba(255,255,255,0.30);
        font: 10px/1 'Courier New', monospace;
        letter-spacing: 1px;
        pointer-events: none;
        z-index: 100;
      }
      .crosshair {
        position: fixed;
        top: 50%;
        left: 50%;
        pointer-events: none;
        z-index: 200;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
      }
      .crosshair::before,
      .crosshair::after {
        content: '';
        position: absolute;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.95);
      }
      /* horizontal arms */
      .crosshair::before {
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        margin-top: -1px;
        background: linear-gradient(
          to right,
          rgba(255,255,255,0.95) 0%,
          rgba(255,255,255,0.95) calc(50% - 3px),
          transparent calc(50% - 3px),
          transparent calc(50% + 3px),
          rgba(255,255,255,0.95) calc(50% + 3px),
          rgba(255,255,255,0.95) 100%
        );
      }
      /* vertical arms */
      .crosshair::after {
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        margin-left: -1px;
        background: linear-gradient(
          to bottom,
          rgba(255,255,255,0.95) 0%,
          rgba(255,255,255,0.95) calc(50% - 3px),
          transparent calc(50% - 3px),
          transparent calc(50% + 3px),
          rgba(255,255,255,0.95) calc(50% + 3px),
          rgba(255,255,255,0.95) 100%
        );
      }
    `,
  ],
})
export class App implements AfterViewInit {
  @ViewChild('canvas') private canvasRef!: ElementRef;

  private camera!: THREE.PerspectiveCamera;
  private controls!: PointerLockControls;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private movement!: MovementController;
  private weapon!: WeaponBuilder;
  private ledLights: THREE.Mesh[] = [];
  private footstepTimer = 0;

  fps = 0;
  weaponName = 'M4 CQB Tanker';
  private fpsFrameCount = 0;
  private fpsLastTime = 0;
  private lastFrameTime = 0;
  private lastLedUpdate = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.initScene();
    this.startRenderingLoop();
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08090f);
    this.scene.fog = new THREE.FogExp2(0x08090f, 0.07);

    this.setupCamera();
    this.setupRenderer();
    this.setupControls();

    setupLighting(this.scene);
    buildRoom(this.scene, this.renderer.capabilities.getMaxAnisotropy());

    const dc = new DatacenterBuilder();
    dc.build(this.scene);
    this.ledLights = dc.ledLights;

    this.weapon = new WeaponBuilder(60, window.innerWidth / window.innerHeight, this.renderer);
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 1.7, 4);
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 0.65));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.875;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  private setupControls(): void {
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.renderer.domElement.addEventListener('click', () => {
      SoundFX.unlock();
      this.controls.lock();
    });
    this.movement = new MovementController(this.camera, this.controls);
    window.addEventListener('keydown', (e) => {
      this.movement.onKeyChange(e.code, true);
      if (e.code === 'KeyQ' && this.weapon) {
        this.weapon.switchWeapon();
        setTimeout(() => {
          this.weaponName = this.weapon.weaponName;
          this.cdr.detectChanges();
        }, 320);
      }
      if (e.code === 'KeyH' && this.weapon) {
        this.weapon.toggleHands();
        setTimeout(() => {
          this.weaponName = this.weapon.weaponName;
          this.cdr.detectChanges();
        }, 320);
      }
      if (e.code === 'KeyF') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    });
    window.addEventListener('keyup', (e) => this.movement.onKeyChange(e.code, false));
    window.addEventListener('mousedown', (e) => {
      if (!this.controls.isLocked) return;
      if (e.button === 0 && this.weapon) this.weapon.onFire();
    });
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.weapon.updateAspect(window.innerWidth / window.innerHeight);
  }

  private startRenderingLoop() {
    this.renderer.setAnimationLoop(() => {
      this.animate();
    });
  }

  private animate() {
    const now = performance.now();
    const delta = Math.min((now - (this.lastFrameTime || now)) / 1000, 0.05);
    this.lastFrameTime = now;

    // Only move if controls are locked
    if (this.controls.isLocked) {
      this.movement.update(delta);
      // Footstep sound — ogni ~0.42 s di camminata
      if (this.movement.isMoving) {
        this.footstepTimer -= delta;
        if (this.footstepTimer <= 0) {
          SoundFX.footstep();
          this.footstepTimer = 0.42;
        }
      } else {
        this.footstepTimer = 0; // reset so next step fires immediately
      }
    }

    // Weapon bob
    this.weapon.update(delta, this.controls.isLocked && this.movement.isMoving);

    // Blink LEDs randomly (Throttled)
    if (now - this.lastLedUpdate > 200) {
      this.ledLights.forEach((led) => {
        led.visible = Math.random() > 0.3;
      });
      this.lastLedUpdate = now;
    }

    // FPS counter — update every 500ms
    this.fpsFrameCount++;
    if (now - this.fpsLastTime >= 500) {
      this.fps = Math.round((this.fpsFrameCount * 1000) / (now - this.fpsLastTime));
      this.fpsFrameCount = 0;
      this.fpsLastTime = now;
      this.cdr.detectChanges(); // trigger Angular change detection from outside the zone
    }

    this.renderer.render(this.scene, this.camera);

    // Render weapon on top (clear depth so it never clips geometry)
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.weapon.scene, this.weapon.camera);
    this.renderer.autoClear = true;
  }
}
