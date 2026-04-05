import { THREE } from '../core/three.js';

const KEY_BINDINGS = {
  a: 'left',
  ArrowRight: 'right',
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  w: 'up',
  s: 'down',
};

export function setupInput(state, world, scene, hud) {
  hud?.setPaused?.(state.isPaused);

  const setKey = (event, value) => {
    const key = KEY_BINDINGS[event.key];
    if (key) {
      state.keys[key] = value;
    }
  };

  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'p' && !event.repeat) {
      state.isPaused = !state.isPaused;

      if (state.isPaused) {
        Object.keys(state.keys).forEach((key) => {
          state.keys[key] = false;
        });
      }

      hud?.setPaused?.(state.isPaused);
      return;
    }

    setKey(event, true);
  });
  window.addEventListener('keyup', (event) => setKey(event, false));

  window.addEventListener('click', () => {
    if (state.isPaused || state.ammo <= 0) {
      return;
    }

    state.ammo -= 1;

    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );

    bullet.position.copy(world.ship.position);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(world.ship.quaternion);

    bullet.userData.velocity = direction.multiplyScalar(1.5);
    scene.add(bullet);
    state.bullets.push(bullet);
  });
}
