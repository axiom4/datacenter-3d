import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import { COLOR_DARK_GREY } from './constants';
import { setupLighting } from './lighting-setup';
import { buildRoom } from './room-builder';
import { DatacenterBuilder } from './datacenter-builder';
import { MovementController } from './movement-controller';

@Component({
  selector: 'app-root',
  template: `
    <canvas #canvas class="three-canvas"></canvas>
    <div class="fps-counter">{{ fps }} FPS</div>
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
  private ledLights: THREE.Mesh[] = [];

  fps = 0;
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
    this.scene.background = new THREE.Color(COLOR_DARK_GREY);
    this.scene.fog = new THREE.FogExp2(COLOR_DARK_GREY, 0.01);

    this.setupCamera();
    this.setupRenderer();
    this.setupControls();

    setupLighting(this.scene);
    buildRoom(this.scene, this.renderer.capabilities.getMaxAnisotropy());

    const dc = new DatacenterBuilder();
    dc.build(this.scene);
    this.ledLights = dc.ledLights;

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 1.7, 6);
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  private setupControls(): void {
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.renderer.domElement.addEventListener('click', () => this.controls.lock());
    this.movement = new MovementController(this.camera, this.controls);
    window.addEventListener('keydown', (e) => this.movement.onKeyChange(e.code, true));
    window.addEventListener('keyup', (e) => this.movement.onKeyChange(e.code, false));
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    }

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
  }
}
