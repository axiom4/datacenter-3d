/**
 * weapon-textures.ts
 * Procedural canvas textures, normal-map generator and shared PBR
 * materials used across all weapon geometry files.
 */
import * as THREE from 'three';

/**
 * WeaponTextures — procedural canvas textures and shared PBR materials for all weapons.
 * All generator methods are static; module-level exports below hold the shared singletons.
 */
export class WeaponTextures {
  // ─── Helpers ──────────────────────────────────────────────────────────────────

  static hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }

  static makeNormalFromCanvas(tex: THREE.CanvasTexture, strength = 1.5): THREE.CanvasTexture {
    const src = tex.image as HTMLCanvasElement;
    const w = src.width;
    const h = src.height;
    const ctx0 = src.getContext('2d')!;
    const srcData = ctx0.getImageData(0, 0, w, h).data;

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    const out = ctx.createImageData(w, h);

    const luma = (i: number) =>
      (srcData[i] * 0.299 + srcData[i + 1] * 0.587 + srcData[i + 2] * 0.114) / 255;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const l = luma((y * w + Math.min(x + 1, w - 1)) * 4);
        const r = luma((y * w + Math.max(x - 1, 0)) * 4);
        const d = luma((Math.min(y + 1, h - 1) * w + x) * 4);
        const u = luma((Math.max(y - 1, 0) * w + x) * 4);
        const nx = (r - l) * strength;
        const ny = (d - u) * strength;
        const nz = 1.0;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        out.data[i] = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
        out.data[i + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
        out.data[i + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
        out.data[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);

    const norm = new THREE.CanvasTexture(c);
    norm.wrapS = norm.wrapT = THREE.RepeatWrapping;
    norm.repeat.copy(tex.repeat);
    return norm;
  }

  // ─── Texture generators ───────────────────────────────────────────────────────

  /** Dark parkerised metal with fine grain and micro-scratches */
  static makeMetalTexture(
    size = 256,
    baseHex = '#1c1c1c',
    scratchAlpha = 0.18,
  ): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < size * size * 0.6; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = Math.floor(Math.random() * 30) - 10;
      const [r, g, b] = WeaponTextures.hexToRgb(baseHex);
      const clamp = (n: number) => Math.max(0, Math.min(255, n));
      ctx.fillStyle = `rgb(${clamp(r + v)},${clamp(g + v)},${clamp(b + v)})`;
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.globalAlpha = scratchAlpha;
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * size;
      const len = 8 + Math.random() * 40;
      const x = Math.random() * (size - len);
      ctx.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  /** Milled aluminium rail pattern with horizontal grooves */
  static makeRailTexture(size = 256): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size / 4;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#232323';
    ctx.fillRect(0, 0, c.width, c.height);

    const step = 8;
    for (let x = 0; x < c.width; x += step) {
      ctx.fillStyle = '#2e2e2e';
      ctx.fillRect(x, 0, step - 2, c.height);
      ctx.fillStyle = '#111111';
      ctx.fillRect(x + step - 2, 0, 2, c.height);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x, 0, 2, c.height);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }

  /** Aggressive polymer stippling — tiny raised dots */
  static makeStipplingTexture(size = 256): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, size, size);

    const spacing = 7;
    for (let y = 0; y < size; y += spacing) {
      for (let x = 0; x < size; x += spacing) {
        const jx = x + (Math.random() - 0.5) * 3;
        const jy = y + (Math.random() - 0.5) * 3;
        const r = 1.2 + Math.random() * 0.8;
        const bright = 35 + Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
        ctx.beginPath();
        ctx.arc(jx, jy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  /** Wood grain for stock */
  static makeWoodTexture(size = 256): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#1e1208';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 80; i++) {
      const y0 = Math.random() * size;
      const cp1x = size * 0.3 + Math.random() * size * 0.2;
      const cp1y = y0 + (Math.random() - 0.5) * 12;
      const x2 = size;
      const y2 = y0 + (Math.random() - 0.5) * 8;
      const alpha = 0.06 + Math.random() * 0.12;
      const dark = Math.random() > 0.5;
      ctx.strokeStyle = dark ? `rgba(0,0,0,${alpha})` : `rgba(80,50,20,${alpha})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.quadraticCurveTo(cp1x, cp1y, x2, y2);
      ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, 'rgba(255,200,100,0.04)');
    grad.addColorStop(0.5, 'rgba(255,200,100,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.02)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }

  /** Knife blade — stonewash / bead-blast + directional grind lines */
  static makeKnifeBladeTexture(size = 512): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < size * size * 0.55; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = Math.floor(Math.random() * 42) - 14;
      const base = 23;
      const clamp = (n: number) => Math.max(0, Math.min(255, n));
      ctx.fillStyle = `rgb(${clamp(base + v)},${clamp(base + v)},${clamp(base + v + 2)})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 180; i++) {
      const y0 = Math.random() * size;
      const len = size * (0.4 + Math.random() * 0.6);
      const x0 = Math.random() * (size - len);
      ctx.strokeStyle = Math.random() > 0.45 ? '#c8c8c8' : '#090909';
      ctx.lineWidth = 0.4 + Math.random() * 0.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + len, y0 + (Math.random() - 0.5) * 1.5);
      ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, size * 0.72, 0, size);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.4, 'rgba(160,160,160,0.18)');
    grad.addColorStop(1.0, 'rgba(200,200,200,0.30)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    return t;
  }

  /** Compressed leather — stacked washer texture with pores + horizontal rings */
  static makeLeatherTexture(size = 256): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#150d04';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 28; i++) {
      const y = (i / 28) * size;
      const alpha = 0.06 + Math.random() * 0.1;
      ctx.strokeStyle = `rgba(255,180,80,${alpha})`;
      ctx.lineWidth = 0.8 + Math.random();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (Math.random() - 0.5) * 3);
      ctx.stroke();
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 1.4})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y + 1.5);
      ctx.lineTo(size, y + 1.5);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 3200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 0.5 + Math.random() * 1.2;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.6)' : 'rgba(80,45,10,0.3)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 4);
    return t;
  }
}

// ─── Shared texture instances (module singletons) ─────────────────────────────

export const _metalTex = WeaponTextures.makeMetalTexture(256, '#1c1c1c', 0.22);
export const _metalNorm = WeaponTextures.makeNormalFromCanvas(_metalTex, 1.2);
export const _railTex = WeaponTextures.makeRailTexture(256);
export const _railNorm = WeaponTextures.makeNormalFromCanvas(_railTex, 2.0);
export const _barrelTex = WeaponTextures.makeMetalTexture(256, '#111111', 0.1);
export const _barrelNorm = WeaponTextures.makeNormalFromCanvas(_barrelTex, 0.8);
export const _knifeBladeTex = WeaponTextures.makeKnifeBladeTexture(512);
export const _knifeBladeNrm = WeaponTextures.makeNormalFromCanvas(_knifeBladeTex, 1.8);
export const _leatherTex = WeaponTextures.makeLeatherTexture(256);
export const _leatherNrm = WeaponTextures.makeNormalFromCanvas(_leatherTex, 2.4);
export const _stippleTex = WeaponTextures.makeStipplingTexture(256);
export const _stippleNorm = WeaponTextures.makeNormalFromCanvas(_stippleTex, 3.0);
export const _woodTex = WeaponTextures.makeWoodTexture(256);
export const _woodNorm = WeaponTextures.makeNormalFromCanvas(_woodTex, 1.5);

// ─── Shared PBR materials ─────────────────────────────────────────────────────

export const matReceiver = new THREE.MeshStandardMaterial({
  map: _metalTex,
  normalMap: _metalNorm,
  normalScale: new THREE.Vector2(0.8, 0.8),
  roughness: 0.38,
  metalness: 0.88,
});

export const matMetal = new THREE.MeshStandardMaterial({
  map: _railTex,
  normalMap: _railNorm,
  normalScale: new THREE.Vector2(1.2, 1.2),
  roughness: 0.4,
  metalness: 0.85,
});

export const matBarrel = new THREE.MeshStandardMaterial({
  map: _barrelTex,
  normalMap: _barrelNorm,
  normalScale: new THREE.Vector2(0.5, 0.5),
  roughness: 0.18,
  metalness: 0.96,
});

export const matGrip = new THREE.MeshStandardMaterial({
  map: _stippleTex,
  normalMap: _stippleNorm,
  normalScale: new THREE.Vector2(2.0, 2.0),
  roughness: 0.95,
  metalness: 0.02,
  color: 0x0e0e0e,
});

/** FDE / coyote-brown polymer for SEAL SOPMOD parts */
export const matFDE = new THREE.MeshStandardMaterial({
  map: _stippleTex,
  normalMap: _stippleNorm,
  normalScale: new THREE.Vector2(1.5, 1.5),
  color: 0x7a6040,
  roughness: 0.88,
  metalness: 0.04,
});

/** Alias kept for compatibility */
export const matStock = matFDE;

export const matMuzzle = new THREE.MeshStandardMaterial({
  map: _metalTex,
  normalMap: _metalNorm,
  normalScale: new THREE.Vector2(0.6, 0.6),
  roughness: 0.25,
  metalness: 0.92,
  color: 0x282828,
});

// ─── Backward-compat named exports ──────────────────────────────────────────────────────────────────────────────────────
export const hexToRgb = (hex: string) => WeaponTextures.hexToRgb(hex);
export const makeNormalFromCanvas = (tex: THREE.CanvasTexture, strength = 1.5) =>
  WeaponTextures.makeNormalFromCanvas(tex, strength);
export const makeMetalTexture = (size = 256, baseHex = '#1c1c1c', scratchAlpha = 0.18) =>
  WeaponTextures.makeMetalTexture(size, baseHex, scratchAlpha);
export const makeRailTexture = (size = 256) => WeaponTextures.makeRailTexture(size);
export const makeStipplingTexture = (size = 256) => WeaponTextures.makeStipplingTexture(size);
export const makeWoodTexture = (size = 256) => WeaponTextures.makeWoodTexture(size);
export const makeKnifeBladeTexture = (size = 512) => WeaponTextures.makeKnifeBladeTexture(size);
export const makeLeatherTexture = (size = 256) => WeaponTextures.makeLeatherTexture(size);
