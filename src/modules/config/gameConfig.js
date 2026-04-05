import { THREE } from '../core/three.js';

export const MOVEMENT_CONFIG = {
  acceleration: 0.053,
  damping: 0.95,
  fuelDurationSeconds: 20,
  cameraOffset: new THREE.Vector3(0, 2, 15),
  cameraSmoothFactor: 0.055,
};

export const STATION_CONFIG = {
  dockingDistance: 25,
  approachDistance: 60,
  warpStartDistance: 40,
  warpMaxDistance: 10,
  refuelRadius: 18,
  refuelSpeed: 0.5,
};

export const MONSTER_CONFIG = {
  count: 5,
  collisionDistance: 1.2,
  drainDistance: 3,
  minOrbitRadius: 2,
};

export const HUD_SELECTORS = {
  fuelLevel: '#fuelLevel',
  fuelText: '#fuelText',
  miniMap: '#miniMap',
  commandPanel: '#commandPanel',
  toggleDock: '#toggleDock',
  dockContent: '#dockContent',
  widgetToggle: '#widgetToggle',
  widgetContainer: '#widgetContainer',
  pauseIndicator: '#pauseIndicator',
};
