/**
 * weapon-models.ts — barrel re-export
 *
 * Each weapon lives in its own class file under ./weapons/.
 * The backward-compatible function wrappers below keep weapon-builder.ts unchanged.
 */
import * as THREE from 'three';

export { HandsWeapon }   from './weapons/hands-weapon';
export { BerettaWeapon } from './weapons/beretta-weapon';
export { KnifeWeapon }   from './weapons/knife-weapon';
export { M203Weapon }    from './weapons/m203-weapon';
export { RifleWeapon }   from './weapons/rifle-weapon';

import { HandsWeapon }   from './weapons/hands-weapon';
import { BerettaWeapon } from './weapons/beretta-weapon';
import { KnifeWeapon }   from './weapons/knife-weapon';
import { M203Weapon }    from './weapons/m203-weapon';
import { RifleWeapon }   from './weapons/rifle-weapon';

export const buildHands = (): THREE.Group => HandsWeapon.build();

export const buildBeretta = (): THREE.Group => BerettaWeapon.build();

export const buildKnife = (): THREE.Group => KnifeWeapon.build();

export const buildM203 = (): THREE.Group => M203Weapon.build();

export const buildRifle = (): THREE.Group => RifleWeapon.build();

