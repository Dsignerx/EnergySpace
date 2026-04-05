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
  const widgetButtons = document.querySelectorAll('.widgetBtn[data-power]');

  const updatePowerButtons = () => {
    widgetButtons.forEach((button) => {
      const isActive = button.dataset.power === state.selectedPower;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  widgetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedPower = button.dataset.power ?? 'bullet';
      updatePowerButtons();
    });
  });

  updatePowerButtons();

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

  window.addEventListener('click', (event) => {
    const targetElement = event.target instanceof Element ? event.target : null;
    if (targetElement?.closest('#commandPanel')) {
      return;
    }

    if (state.isPaused) {
      return;
    }

    if (state.selectedPower === 'explosion') {
      if (state.explosionCooldown > 0) {
        return;
      }

      state.explosionCooldown = 1.2;

      state.monsters.forEach((monster) => {
        const direction = new THREE.Vector3().subVectors(monster.position, world.ship.position);
        const distance = Math.max(direction.length(), 0.5);
        direction.normalize();

        const force = Math.max(0, 12 - distance) * 0.11;
        if (!monster.userData.knockback) {
          monster.userData.knockback = new THREE.Vector3();
        }

        monster.userData.knockback.add(direction.multiplyScalar(force));
      });

      return;
    }

    if (state.ammo <= 0) {
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
