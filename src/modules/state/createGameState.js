import { THREE } from '../core/three.js';

export function createGameState() {
  return {
    velocity: new THREE.Vector3(),
    fuel: 1,
    pulseTime: 0,
    ammo: 15,
    quantumJump: false,
    quantumProgress: 0,
    currentUniverse: 'normal',
    inInterior: false,
    warpFactor: 0,
    bullets: [],
    monsters: [],
    planets: [],
    miniPlanets: [],
    landingLights: [],
    windowMaterials: [],
    isPaused: false,
    keys: {
      left: false,
      right: false,
      forward: false,
      backward: false,
      up: false,
      down: false,
    },
  };
}
