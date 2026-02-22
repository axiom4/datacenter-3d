import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import {
  ROOM_SIZE,
  WALL_HEIGHT,
  DOOR_FRAME_W,
  DOOR_FRAME_H,
  DOOR_FRAME_D,
  U_HEIGHT,
  RACK_UNITS,
  RACK_WIDTH,
  RACK_DEPTH,
  COLOR_DARK_GREY,
} from './constants';
import {
  createFloorTexture,
  createCeilingTexture,
  createWallTexture,
  createBrushedMetalTexture,
  createHazardStripeTexture,
  createExitSignTexture,
  createServerFaceMaterial,
  createServerRearMaterial,
  createRackFrameMaterial,
} from './texture-factory';
import { MovementController } from './movement-controller';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit {
  @ViewChild('canvas') private canvasRef!: ElementRef;

  private camera!: THREE.PerspectiveCamera;
  private controls!: PointerLockControls;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private ledLights: THREE.Mesh[] = [];

  // FPS counter
  fps = 0;
  private fpsFrameCount = 0;
  private fpsLastTime = 0;

  private movement!: MovementController;
  private lastFrameTime = 0;

  // Shared Resources
  private sharedRackFrameGeo: THREE.BoxGeometry | null = null;
  private sharedRackTopGeo: THREE.BoxGeometry | null = null;
  private sharedRackRearGeo: THREE.BoxGeometry | null = null;
  private sharedRackFrameMat!: THREE.MeshStandardMaterial; // Initialized in constructor
  private sharedServerMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.7,
    roughness: 0.4,
    side: THREE.FrontSide, // Shadows work better with FrontSide for closed geometry
    shadowSide: THREE.BackSide, // Optimization for self-shadowing
  });
  private sharedFaceMat!: THREE.MeshStandardMaterial; // Initialized in constructor
  private sharedRearMat!: THREE.MeshStandardMaterial; // Initialized in constructor

  // LED Shared Resources
  private sharedLedGeo = new THREE.PlaneGeometry(0.008, 0.008);
  private sharedLedMatGreen = new THREE.MeshBasicMaterial({ color: 0x00ff00, toneMapped: false });
  private sharedLedMatBlue = new THREE.MeshBasicMaterial({ color: 0x0088ff, toneMapped: false });
  private sharedLedMatAmber = new THREE.MeshBasicMaterial({ color: 0xffaa00, toneMapped: false });

  // Server Geometry Cache
  private sharedServerGeo1U: THREE.BoxGeometry | null = null;
  private sharedServerGeo2U: THREE.BoxGeometry | null = null;
  private sharedServerGeo4U: THREE.BoxGeometry | null = null;

  // Face / Rear Geometry Cache (shared per U-size, avoids ~2800 duplicates)
  private sharedFaceGeo1U: THREE.BoxGeometry | null = null;
  private sharedFaceGeo2U: THREE.BoxGeometry | null = null;
  private sharedFaceGeo4U: THREE.BoxGeometry | null = null;

  // Overhead Lamp Shared Geometries & Materials (avoids 21× duplication)
  private sharedHousingGeo = new THREE.BoxGeometry(0.5, 0.1, 2.6);
  private sharedLampPanelGeo = new THREE.BoxGeometry(0.4, 0.05, 2.4);
  private sharedCableGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2);
  private sharedHousingMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.5,
    metalness: 0.7,
  });
  private sharedLampPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff5e8 });
  private sharedCableMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  constructor(private cdr: ChangeDetectorRef) {
    this.sharedFaceMat = createServerFaceMaterial();
    this.sharedRearMat = createServerRearMaterial();
    this.sharedRackFrameMat = createRackFrameMaterial();
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.createScene();
    this.startRenderingLoop();
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLOR_DARK_GREY);
    this.scene.fog = new THREE.FogExp2(COLOR_DARK_GREY, 0.01);

    this.setupLighting();
    this.setupCameraAndRenderer();
    this.setupControls();

    this.createRoom();
    this.createDatacenterAisles();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupLighting() {
    // Very dim cool-blue ambient light — typical for dark datacenter
    const ambientLight = new THREE.AmbientLight(0x334466, 1.5);
    this.scene.add(ambientLight);

    // Hemisphere: cool blue sky, near-black ground
    const hemiLight = new THREE.HemisphereLight(0x1a2a4a, 0x080808, 10.8);
    hemiLight.position.set(0, WALL_HEIGHT, 0);
    this.scene.add(hemiLight);

    // Single shadow-casting directional light (low intensity, just for shadow depth)
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
    this.scene.add(shadowLight);
    this.scene.add(shadowLight.target);

    // Subtle blue glow emanating from each rack row — server equipment ambient
    const rackRowsX = [-4.55, -1.45, 1.45, 4.55];
    rackRowsX.forEach((rx) => {
      const glow = new THREE.PointLight(0x0044cc, 0.4, 6, 2);
      glow.position.set(rx, 1.2, 0);
      this.scene.add(glow);
    });

    // Single row of blue lights along the center of the ceiling
    for (let cz = -8; cz <= 8; cz += 4) {
      const ceilLight = new THREE.PointLight(0x2255ff, 40.0, 16, 1.5);
      ceilLight.position.set(0, WALL_HEIGHT - 0.1, cz);
      this.scene.add(ceilLight);
    }

    this.createOverheadLights();
  }

  private setupCameraAndRenderer() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 1.7, 6);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // cheaper than PCFSoft, still smooth enough
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  private setupControls() {
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.renderer.domElement.addEventListener('click', () => this.controls.lock());

    this.movement = new MovementController(this.camera, this.controls);
    window.addEventListener('keydown', (e) => this.movement.onKeyChange(e.code, true));
    window.addEventListener('keyup', (e) => this.movement.onKeyChange(e.code, false));
  }

  // --- Scene Construction Logic ---

  private createRoom() {
    this.createFloor();
    this.createCeiling();
    this.createWalls();
    this.createDoor();
  }

  private createFloor() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
    // Raised access floor: slightly reflective dark tiles
    const floorMat = new THREE.MeshStandardMaterial({
      map: createFloorTexture(this.renderer.capabilities.getMaxAnisotropy()),
      roughness: 0.35,
      metalness: 0.25,
      envMapIntensity: 0.6,
      side: THREE.FrontSide,
      transparent: false,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private createCeiling() {
    const ceilingGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
    // Real datacenters have black/very dark ceilings with exposed infrastructure
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: createCeilingTexture(),
      color: 0xaaaaaa,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.FrontSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.receiveShadow = true;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    this.scene.add(ceiling);
  }

  private createWalls() {
    const wallGeo = new THREE.PlaneGeometry(ROOM_SIZE, WALL_HEIGHT);
    // Dark industrial walls — typical concrete/painted steel datacenter
    const wallMat = new THREE.MeshStandardMaterial({
      map: createWallTexture(),
      roughness: 0.85,
      metalness: 0.05,
      color: 0x555555, // Darker than before — less light bounce
      side: THREE.FrontSide,
      transparent: false,
    });

    const positions = [
      { pos: [0, WALL_HEIGHT / 2, -ROOM_SIZE / 2], rot: 0 }, // Back
      { pos: [0, WALL_HEIGHT / 2, ROOM_SIZE / 2], rot: Math.PI }, // Front
      { pos: [-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0], rot: Math.PI / 2 }, // Left
      { pos: [ROOM_SIZE / 2, WALL_HEIGHT / 2, 0], rot: -Math.PI / 2 }, // Right
    ];

    positions.forEach((config) => {
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(config.pos[0], config.pos[1], config.pos[2]);
      wall.rotation.y = config.rot;
      wall.receiveShadow = true;
      this.scene.add(wall);
    });
  }

  private createDoor() {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, -ROOM_SIZE / 2 + 0.11); // +0.11 to avoid z-fight with wall

    // Frame
    const frameGeo = new THREE.BoxGeometry(DOOR_FRAME_W, DOOR_FRAME_H, DOOR_FRAME_D);
    const frameMat = new THREE.MeshStandardMaterial({
      color: COLOR_DARK_GREY,
      side: THREE.FrontSide,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = DOOR_FRAME_H / 2;
    frame.castShadow = true;
    frame.receiveShadow = true;
    doorGroup.add(frame);

    // Leaf
    const doorLeafGroup = new THREE.Group();
    doorLeafGroup.position.set(0, 0, 0.08); // offset so leaf front face clears frame front face
    doorGroup.add(doorLeafGroup);

    const doorMat = new THREE.MeshStandardMaterial({
      map: createBrushedMetalTexture(),
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.4,
    });

    const leafWidth = DOOR_FRAME_W - 0.2;
    const leafHeight = DOOR_FRAME_H - 0.2;
    const leafDepth = 0.1;
    const bottomH = 0.9;
    const topH = 0.4;
    const midH = leafHeight - bottomH - topH;
    const sideW = 0.2;

    // Panels construction
    const panelConfigs = [
      { w: leafWidth, h: bottomH, y: bottomH / 2, x: 0 }, // Bottom
      { w: leafWidth, h: topH, y: leafHeight - topH / 2, x: 0 }, // Top
      { w: sideW, h: midH, y: bottomH + midH / 2, x: -(leafWidth / 2 - sideW / 2) }, // Left
      { w: sideW, h: midH, y: bottomH + midH / 2, x: leafWidth / 2 - sideW / 2 }, // Right
    ];

    panelConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, leafDepth), doorMat);
      mesh.position.set(cfg.x, cfg.y, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      doorLeafGroup.add(mesh);
    });

    // Window
    const windowW = leafWidth - sideW * 2;
    const windowMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0.1,
      roughness: 0.0,
      transparent: true,
      opacity: 0.3,
      transmission: 0.9,
      thickness: 0.02,
    });
    const windowPane = new THREE.Mesh(new THREE.BoxGeometry(windowW, midH, 0.02), windowMat);
    windowPane.position.set(0, bottomH + midH / 2, 0);
    doorLeafGroup.add(windowPane);

    // Bars
    const barGeo = new THREE.CylinderGeometry(0.005, 0.005, midH);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    [-1, 1].forEach((dir) => {
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set((dir * windowW) / 6, bottomH + midH / 2, 0);
      doorLeafGroup.add(bar);
    });

    // Kickplate
    const kickGeo = new THREE.BoxGeometry(leafWidth - 0.04, 0.2, leafDepth + 0.01);
    const kickMat = new THREE.MeshStandardMaterial({
      map: createHazardStripeTexture(),
      roughness: 0.8,
      color: 0xffffff,
    });
    const kickPlate = new THREE.Mesh(kickGeo, kickMat);
    kickPlate.position.set(0, 0.15, 0);
    doorLeafGroup.add(kickPlate);

    // Handle & Keypad (Simplified construction logic)
    this.createDoorHardware(doorLeafGroup, leafWidth, leafDepth);

    // Exit Sign
    const signTexture = createExitSignTexture();
    const signGeo = new THREE.BoxGeometry(0.8, 0.25, 0.05);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      emissiveMap: signTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, DOOR_FRAME_H + 0.2, 0);
    doorGroup.add(sign);

    this.scene.add(doorGroup);
  }

  private createDoorHardware(parent: THREE.Group, leafWidth: number, leafDepth: number) {
    // Handle
    const handleGroup = new THREE.Group();
    handleGroup.position.set(leafWidth / 2 - 0.15, 1.0, leafDepth / 2);
    parent.add(handleGroup);

    const baseP = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.15, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    handleGroup.add(baseP);

    const handleBarMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2,
    });
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12), handleBarMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 0, 0.06);
    handleGroup.add(handleBar);

    // Keypad - Logic kept simple
    const keypadGroup = new THREE.Group();
    keypadGroup.position.set(leafWidth / 2 - 0.15, 1.25, leafDepth / 2);
    parent.add(keypadGroup);

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
    keypadGroup.add(screen);
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.01, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    );
    led.position.set(0.025, 0.025, 0);
    keypadGroup.add(led);
  }

  /* RE-ENABLE: valid methods */
  private createOverheadLights() {
    // Create rows of long fluorescent lights along the aisles
    // Illuminate all corridors: Center (0), Left Aisle (-3), Right Aisle (3)
    const aisleXPositions = [-3, 0, 3];

    aisleXPositions.forEach((xPos) => {
      for (let z = -9; z <= 9; z += 3) {
        // --- Lamp Fixture ---
        const lampGroup = new THREE.Group();
        lampGroup.position.set(xPos, 3.8, z); // Raised per request (was 3.5)

        // 1. Housing (Grey Metal Box) — shared geometry & material
        const housing = new THREE.Mesh(this.sharedHousingGeo, this.sharedHousingMat);
        lampGroup.add(housing);

        // 2. Emissive Panel — shared
        const lightMesh = new THREE.Mesh(this.sharedLampPanelGeo, this.sharedLampPanelMat);
        lightMesh.position.y = -0.05;
        lampGroup.add(lightMesh);

        // 3. Cables — shared
        const cable1 = new THREE.Mesh(this.sharedCableGeo, this.sharedCableMat);
        cable1.position.set(0, 0.15, -1.0);
        lampGroup.add(cable1);

        const cable2 = new THREE.Mesh(this.sharedCableGeo, this.sharedCableMat);
        cable2.position.set(0, 0.15, 1.0);
        lampGroup.add(cable2);

        this.scene.add(lampGroup);

        // --- Actual Light Source ---
        // SpotLight every 6m (every other fixture) — halves fragment shader light cost
        // with distance=20m coverage is still full corridor
        if (Math.abs(z % 6) < 0.01 || Math.abs((z % 6) - 6) < 0.01) {
          const spotLight = new THREE.SpotLight(0xfff4e0, 5.6); // doubled intensity to compensate fewer lights
          spotLight.position.set(xPos, 3.7, z);
          spotLight.target.position.set(xPos, 0, z);
          spotLight.angle = Math.PI / 4.0; // slightly wider to cover gap between fixtures
          spotLight.penumbra = 0.65;
          spotLight.decay = 0.0;
          spotLight.distance = 20.0;
          spotLight.castShadow = false;
          this.scene.add(spotLight);
          this.scene.add(spotLight.target);
        }
      }
    });
  }

  private createDatacenterAisles() {
    // Create 4 rows of racks (2 aisles)
    const racksPerRow = 10;
    const rackSpacing = 0.605; // Tight spacing (600mm width + 5mm gap)
    const aisleWidth = 2.5; // Distance between rows in an aisle

    // We will create two main aisles.
    // Aisle 1 centered at X = -3
    // Aisle 2 centered at X = +3

    const aisle1X = -3;
    const aisle2X = 3;

    // --- AISLE 1 ---
    // Left Row of Aisle 1 (Negative X side) -> Faces Positive X -> Rotated 180 = Faces Negative X (-Math.PI / 2)
    for (let i = 0; i < racksPerRow; i++) {
      const z = i * rackSpacing - (racksPerRow * rackSpacing) / 2;
      this.createServerRack(aisle1X - aisleWidth / 2 - 0.3, z, -Math.PI / 2);
    }
    // Right Row of Aisle 1 (Positive X side) -> Faces Negative X -> Rotated 180 = Faces Positive X (Math.PI / 2)
    for (let i = 0; i < racksPerRow; i++) {
      const z = i * rackSpacing - (racksPerRow * rackSpacing) / 2;
      this.createServerRack(aisle1X + aisleWidth / 2 + 0.3, z, Math.PI / 2);
    }

    // --- AISLE 2 ---
    // Left Row of Aisle 2 (Negative X side) -> Faces Positive X -> Rotated 180 = Faces Negative X (-Math.PI / 2)
    for (let i = 0; i < racksPerRow; i++) {
      const z = i * rackSpacing - (racksPerRow * rackSpacing) / 2;
      this.createServerRack(aisle2X - aisleWidth / 2 - 0.3, z, -Math.PI / 2);
    }
    // Right Row of Aisle 2 (Positive X side) -> Faces Negative X -> Rotated 180 = Faces Positive X (Math.PI / 2)
    for (let i = 0; i < racksPerRow; i++) {
      const z = i * rackSpacing - (racksPerRow * rackSpacing) / 2;
      this.createServerRack(aisle2X + aisleWidth / 2 + 0.3, z, Math.PI / 2);
    }
  }

  // --- Start of Server Rack Implementation ---

  private createServerRack(x: number, z: number, rotationY: number) {
    const rackGroup = new THREE.Group();

    // Cabinet Dimensions (Standard 48U)
    const width = 0.6; // 600mm width
    // 1U = 1.75 inches = 44.45mm. 48U = 2133.6mm.
    // Adding space for plinth/casters and top cover, let's say roughly 2m is fine,
    // but let's define the internal mounting height strictly.
    const uHeight = 0.04445; // Exact 1U height in meters
    const usefulHeight = 48 * uHeight; // 2.1336m
    const frameThickness = 0.05; // Top/Bottom thickness
    const height = usefulHeight + frameThickness * 2 + 0.1; // Total cabinet height (approx 2.33m)
    const depth = 1.0; // 1000mm depth

    // 1. Cabinet Frame & Panels
    // Use shared frame material
    const frameMat = this.sharedRackFrameMat;

    // Create an open frame structure instead of a solid box
    const frameGroup = new THREE.Group();

    // Initialize shared geometries
    if (!this.sharedRackFrameGeo)
      this.sharedRackFrameGeo = new THREE.BoxGeometry(0.02, height, depth);
    if (!this.sharedRackTopGeo) this.sharedRackTopGeo = new THREE.BoxGeometry(width, 0.05, depth);
    if (!this.sharedRackRearGeo)
      this.sharedRackRearGeo = new THREE.BoxGeometry(width - 0.04, height - 0.05, 0.02);

    // Side Panels (Solid)
    const leftPanel = new THREE.Mesh(this.sharedRackFrameGeo, frameMat);
    leftPanel.position.set(-width / 2 + 0.01, height / 2, 0);
    leftPanel.castShadow = false;
    leftPanel.receiveShadow = true;
    frameGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(this.sharedRackFrameGeo, frameMat);
    rightPanel.position.set(width / 2 - 0.01, height / 2, 0);
    rightPanel.castShadow = false;
    rightPanel.receiveShadow = true;
    frameGroup.add(rightPanel);

    // Top Panel
    const topPanel = new THREE.Mesh(this.sharedRackTopGeo, frameMat);
    topPanel.position.set(0, height - 0.025, 0);
    topPanel.castShadow = false;
    topPanel.receiveShadow = true;
    frameGroup.add(topPanel);

    // Rear Panel - REMOVED so we can see the server backs
    /*
    const rearPanel = new THREE.Mesh(this.sharedRackRearGeo, this.sharedRackRearMat);
    rearPanel.position.set(0, height / 2, -depth / 2 + 0.01);
    frameGroup.add(rearPanel);
    */

    rackGroup.add(frameGroup);

    // 3. Populate with Servers
    const startY = 0.1; // Starting Y within the rack (above any plinth)
    let currentU = 0;
    // Ensure uHeight is available here
    const uH = 0.04445;

    while (currentU < 48) {
      // 10% chance for empty slot
      if (Math.random() > 0.9) {
        currentU += 1;
        continue;
      }

      // Random server size (1U, 2U, 4U)
      let uSize = 1;
      const r = Math.random();
      if (r > 0.9) uSize = 4;
      else if (r > 0.7) uSize = 2;

      // Check if fits in remaining space
      if (currentU + uSize > 48) {
        uSize = 1;
        if (currentU + uSize > 48) break;
      }

      // Calculate position
      // Y is centered for BoxGeometry, so:
      // startY + (units below * uHeight) + (half this unit's height)
      const posY = startY + currentU * uH + (uSize * uH) / 2;

      this.createServerUnit(
        rackGroup,
        width - 0.05, // Width
        uSize * uH - 0.002, // Height (minus gap)
        depth - 0.1, // Depth
        posY,
      );

      currentU += uSize;
    }

    rackGroup.position.set(x, 0, z);
    rackGroup.rotation.y = rotationY;
    this.scene.add(rackGroup);
  }

  private createServerUnit(parent: THREE.Group, w: number, h: number, d: number, y: number) {
    const serverGroup = new THREE.Group();

    // Chassis
    // Select shared geometry based on approximate height
    let serverGeo;
    // Simple heuristic for U-size matching
    if (h < 0.06) {
      if (!this.sharedServerGeo1U) this.sharedServerGeo1U = new THREE.BoxGeometry(w, h, d);
      serverGeo = this.sharedServerGeo1U;
    } else if (h < 0.12) {
      if (!this.sharedServerGeo2U) this.sharedServerGeo2U = new THREE.BoxGeometry(w, h, d);
      serverGeo = this.sharedServerGeo2U;
    } else {
      if (!this.sharedServerGeo4U) this.sharedServerGeo4U = new THREE.BoxGeometry(w, h, d);
      serverGeo = this.sharedServerGeo4U;
    }

    // Fallback if odd size
    if (!serverGeo) serverGeo = new THREE.BoxGeometry(w, h, d);

    const server = new THREE.Mesh(serverGeo, this.sharedServerMat);
    server.castShadow = false; // Rack frames handle shadow casting; disabling on ~1400 chassis greatly reduces shadow map cost
    server.receiveShadow = true;
    serverGroup.add(server);

    // Front Face (Bezel) — geometry cached per U-size to avoid ~2800 duplicate objects
    let faceGeo: THREE.BoxGeometry;
    if (h < 0.06) {
      if (!this.sharedFaceGeo1U) this.sharedFaceGeo1U = new THREE.BoxGeometry(w + 0.002, h, 0.02);
      faceGeo = this.sharedFaceGeo1U;
    } else if (h < 0.12) {
      if (!this.sharedFaceGeo2U) this.sharedFaceGeo2U = new THREE.BoxGeometry(w + 0.002, h, 0.02);
      faceGeo = this.sharedFaceGeo2U;
    } else {
      if (!this.sharedFaceGeo4U) this.sharedFaceGeo4U = new THREE.BoxGeometry(w + 0.002, h, 0.02);
      faceGeo = this.sharedFaceGeo4U;
    }
    const face = new THREE.Mesh(faceGeo, this.sharedFaceMat);
    face.position.z = d / 2 + 0.01;
    serverGroup.add(face);

    // Rear Face (Ports & Fans) — same dimensions as face, reuse geometry
    const rear = new THREE.Mesh(faceGeo, this.sharedRearMat);
    rear.rotation.y = Math.PI; // Flip texture for back
    rear.position.z = -d / 2 - 0.01;
    serverGroup.add(rear);

    // --- Rear Network Interface LEDs ---
    // Add small blinking LEDs near the ethernet ports on the back

    // Vertical position: Ports are around Y=45..55 on canvas (from Top). Center is 64.
    // 64 - 50 = +14px (Up from center).
    // height 'h' corresponds to server height (e.g. 1U = 0.044).
    // Texture 128px height maps to 'h'.
    const scaleY = h / 128; // Vertical scale
    const scaleX = w / 128; // Horizontal scale

    // Y Offset: 14px up from center
    const yOffset = 14 * scaleY;

    // Horizontal position: Ports are at X=75, 95. Center 64. Offset +11px and +31px.
    const xOffset1 = 11 * scaleX;
    const xOffset2 = 31 * scaleX;

    // Make LEDs slightly larger and much further out to ensure visibility
    const rearLedGeo = new THREE.PlaneGeometry(0.015, 0.015); // Larger

    if (Math.random() > 0.3) {
      const rearLed1 = new THREE.Mesh(
        rearLedGeo,
        Math.random() > 0.5 ? this.sharedLedMatGreen : this.sharedLedMatAmber,
      );
      // Position: X inverted, Y up, Z clearly behind (-0.04 instead of -0.025)
      rearLed1.position.set(-xOffset1, yOffset, -d / 2 - 0.04);
      this.ledLights.push(rearLed1);
      serverGroup.add(rearLed1);
    }

    if (Math.random() > 0.3) {
      const rearLed2 = new THREE.Mesh(
        rearLedGeo,
        Math.random() > 0.5 ? this.sharedLedMatGreen : this.sharedLedMatAmber,
      );
      // Twist slightly to catch the eye? No, simple plane is fine.
      rearLed2.rotation.y = Math.PI; // Face backwards properly
      rearLed2.position.set(-xOffset2, yOffset, -d / 2 - 0.04);

      // Fix rotation for first LED too
      if (serverGroup.children.length > 2) {
        // Just added
        // The previous child was led1
        (serverGroup.children[serverGroup.children.length - 2] as THREE.Mesh).rotation.y = Math.PI;
      }

      this.ledLights.push(rearLed2);
      serverGroup.add(rearLed2);
    }

    // --- Enhanced LED System ---
    // Add multiple LEDs for activity/status

    // 1. Power LED (Static Green) - Left Side
    const powerLed = new THREE.Mesh(this.sharedLedGeo, this.sharedLedMatGreen);
    powerLed.position.set(-w / 2 + 0.02, h / 2 - 0.015, d / 2 + 0.021);
    serverGroup.add(powerLed);

    // 2. Activity LEDs (Blinking Blue/Amber) - Right Side clusters
    // Add a row of 3 small activity lights
    for (let i = 0; i < 3; i++) {
      // Randomly choose Blue or Amber for variety
      const mat = Math.random() > 0.7 ? this.sharedLedMatAmber : this.sharedLedMatBlue;
      const led = new THREE.Mesh(this.sharedLedGeo, mat);

      // Position them in a row
      const offsetX = w / 2 - 0.06 + i * 0.015;
      led.position.set(offsetX, h / 2 - 0.015, d / 2 + 0.021);

      // Add to blinking list
      this.ledLights.push(led);
      serverGroup.add(led);
    }

    // 3. Disk Activity LEDs (Vertical column near drives)
    if (h > 0.08) {
      // Only for 2U/4U servers
      for (let j = 0; j < 4; j++) {
        const diskLed = new THREE.Mesh(this.sharedLedGeo, this.sharedLedMatBlue);
        // Vertical stack on the left side (drive bays)
        diskLed.position.set(-w / 2 + 0.06, -h / 2 + 0.03 + j * 0.015, d / 2 + 0.021);
        this.ledLights.push(diskLed);
        serverGroup.add(diskLed);
      }
    }

    serverGroup.position.set(0, y, 0);
    parent.add(serverGroup);
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

  private lastLedUpdate = 0;

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
