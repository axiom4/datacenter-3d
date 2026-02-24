import * as THREE from 'three';
import { ROOM_WIDTH, ROOM_DEPTH, TILE_SIZE } from './constants';

/**
 * TextureFactory — procedural canvas textures and PBR materials for the scene.
 * All methods are static; instantiation is never needed.
 */
export class TextureFactory {

  // ─── Private helpers ─────────────────────────────────────────────────────

  private static makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return [canvas, canvas.getContext('2d')!];
  }

  private static repeating(
    canvas: HTMLCanvasElement,
    repeatX: number,
    repeatY: number,
    maxAnisotropy = 1,
  ): THREE.CanvasTexture {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    t.anisotropy = maxAnisotropy;
    return t;
  }

  // ─── Room Textures ───────────────────────────────────────────────────────

  static createFloorTexture(maxAnisotropy = 1): THREE.CanvasTexture {
    const [canvas, ctx] = TextureFactory.makeCanvas(512, 512);
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#333333' : '#1a1a1a';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 2, Math.random() * 2);
    }
    return TextureFactory.repeating(canvas, ROOM_WIDTH / TILE_SIZE, ROOM_DEPTH / TILE_SIZE, maxAnisotropy);
  }

  static createCeilingTexture(): THREE.CanvasTexture {
    const [canvas, ctx] = TextureFactory.makeCanvas(512, 512);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 4;
    const step = 512 / 8;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, 512);
      ctx.moveTo(0, i * step);
      ctx.lineTo(512, i * step);
    }
    ctx.stroke();
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#999999' : '#eeeeee';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    return TextureFactory.repeating(canvas, ROOM_WIDTH / 4, ROOM_DEPTH / 4);
  }

  static createWallTexture(): THREE.CanvasTexture {
    const [canvas, ctx] = TextureFactory.makeCanvas(512, 512);
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 10000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#3a3a3a' : '#2a2a2a';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(Math.random() * 512, 0, 50, 512);
    }
    return TextureFactory.repeating(canvas, ROOM_WIDTH / 4, 1);
  }

  // ─── Door Textures ───────────────────────────────────────────────────────

  static createBrushedMetalTexture(): THREE.CanvasTexture {
    const [canvas, ctx] = TextureFactory.makeCanvas(512, 512);
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.5, '#999999');
    grad.addColorStop(1, '#555555');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 20000; i++) {
      const v = Math.floor(Math.random() * 80) + 40;
      ctx.fillStyle = `rgba(${v},${v},${v},0.05)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, Math.random() * 50 + 20);
    }
    return new THREE.CanvasTexture(canvas);
  }

  static createHazardStripeTexture(): THREE.CanvasTexture {
    const [canvas, ctx] = TextureFactory.makeCanvas(256, 64);
    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    for (let x = -50; x < 300; x += 40) {
      ctx.moveTo(x, 64);
      ctx.lineTo(x + 20, 0);
      ctx.lineTo(x + 35, 0);
      ctx.lineTo(x + 15, 64);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 500; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 64, 2, 2);
    }
    return TextureFactory.repeating(canvas, 2, 1);
  }

  static createExitSignTexture(): THREE.CanvasTexture {
    const [canvas, ctx] = TextureFactory.makeCanvas(256, 80);
    ctx.fillStyle = '#003300';
    ctx.fillRect(0, 0, 256, 80);
    ctx.strokeStyle = '#00cc00';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 72);
    ctx.fillStyle = '#00ff44';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', 128, 40);
    return new THREE.CanvasTexture(canvas);
  }

  // ─── Server / Rack Materials ─────────────────────────────────────────────

  static createServerFaceMaterial(): THREE.MeshStandardMaterial {
    const [canvas, ctx] = TextureFactory.makeCanvas(128, 128);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#1a1a1a';
    for (let y = 10; y < 118; y += 8) ctx.fillRect(10, y, 108, 4);
    ctx.fillStyle = '#222222';
    for (let x = 10; x < 80; x += 25) ctx.fillRect(x, 10, 2, 108);
    return new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      emissive: 0x000000,
      roughness: 0.4,
      metalness: 0.6,
      side: THREE.FrontSide,
      transparent: false,
    });
  }

  static createServerRearMaterial(): THREE.MeshStandardMaterial {
    const [canvas, ctx] = TextureFactory.makeCanvas(128, 128);
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#222222';
    ctx.fillRect(10, 10, 30, 108);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(25, 64, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.fillRect(50, 40, 68, 48);
    ctx.fillStyle = '#000000';
    ctx.fillRect(55, 45, 10, 6);
    ctx.fillRect(55, 55, 10, 6);
    ctx.fillRect(75, 45, 12, 12);
    ctx.fillRect(95, 45, 12, 12);
    for (let x = 50; x < 110; x += 20) {
      ctx.beginPath();
      ctx.arc(x + 10, 100, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.5,
      side: THREE.FrontSide,
      transparent: false,
    });
  }

  static createRackFrameMaterial(): THREE.MeshStandardMaterial {
    const [canvas, ctx] = TextureFactory.makeCanvas(256, 256);
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#2a2a2a' : '#151515';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    return new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.4,
      side: THREE.FrontSide,
      transparent: false,
    });
  }
}

// ─── Backward-compat named exports ───────────────────────────────────────────
export const createFloorTexture        = (a?: number)    => TextureFactory.createFloorTexture(a);
export const createCeilingTexture      = ()              => TextureFactory.createCeilingTexture();
export const createWallTexture         = ()              => TextureFactory.createWallTexture();
export const createBrushedMetalTexture = ()              => TextureFactory.createBrushedMetalTexture();
export const createHazardStripeTexture = ()              => TextureFactory.createHazardStripeTexture();
export const createExitSignTexture     = ()              => TextureFactory.createExitSignTexture();
export const createServerFaceMaterial  = ()              => TextureFactory.createServerFaceMaterial();
export const createServerRearMaterial  = ()              => TextureFactory.createServerRearMaterial();
export const createRackFrameMaterial   = ()              => TextureFactory.createRackFrameMaterial();

