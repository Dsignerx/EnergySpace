import { THREE } from '../core/three.js';
import { MONSTER_CONFIG, MOVEMENT_CONFIG, STATION_CONFIG } from '../config/gameConfig.js';

function updateSkyByTime(scene, galaxy) {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;

  if (isDay) {
    scene.background = new THREE.Color(0x0a0f1f);
    galaxy.material.opacity = 0.4;
    scene.fog = new THREE.Fog(0x0a0f1f, 100, 600);
    return;
  }

  scene.background = new THREE.Color(0x000000);
  galaxy.material.opacity = 0.9;
  scene.fog = new THREE.Fog(0x000000, 40, 300);
}

function updateBullets(scene, state) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    bullet.position.add(bullet.userData.velocity);

    if (bullet.position.length() > 500) {
      scene.remove(bullet);
      state.bullets.splice(i, 1);
      continue;
    }

    for (let j = state.monsters.length - 1; j >= 0; j -= 1) {
      const monster = state.monsters[j];
      if (bullet.position.distanceTo(monster.position) < MONSTER_CONFIG.collisionDistance) {
        scene.remove(monster);
        scene.remove(bullet);
        state.monsters.splice(j, 1);
        state.bullets.splice(i, 1);
        break;
      }
    }
  }
}

function updateShip(state, world, hud) {
  const { ship } = world;

  if (state.fuel > 0) {
    if (state.keys.left) state.velocity.x -= MOVEMENT_CONFIG.acceleration;
    if (state.keys.right) state.velocity.x += MOVEMENT_CONFIG.acceleration;
    if (state.keys.forward) state.velocity.z -= MOVEMENT_CONFIG.acceleration;
    if (state.keys.backward) state.velocity.z += MOVEMENT_CONFIG.acceleration;
    if (state.keys.up) state.velocity.y += MOVEMENT_CONFIG.acceleration;
    if (state.keys.down) state.velocity.y -= MOVEMENT_CONFIG.acceleration;
  }

  state.velocity.multiplyScalar(MOVEMENT_CONFIG.damping);

  if (state.velocity.length() > 0.001 && state.fuel > 0) {
    state.fuel -= (1 / MOVEMENT_CONFIG.fuelDurationSeconds) * (1 / 60);
    state.fuel = Math.max(state.fuel, 0);
  }

  ship.position.add(state.velocity);
  ship.rotation.z = -state.velocity.x * 2;
  ship.rotation.x = state.velocity.z * 2;

  if (hud.fuelLevel) hud.fuelLevel.style.width = `${state.fuel * 100}%`;
  if (hud.fuelText) hud.fuelText.textContent = `${Math.round(state.fuel * 100)}%`;
}

function updateMonsters(state, world) {
  state.monsters.forEach((monster, index) => {
    monster.orbitRadius = Math.max(monster.orbitRadius * 0.999, MONSTER_CONFIG.minOrbitRadius);
    monster.orbitAngle += 0.01 + monster.speedOffset;

    const target = new THREE.Vector3(
      world.ship.position.x + Math.cos(monster.orbitAngle) * monster.orbitRadius,
      world.ship.position.y,
      world.ship.position.z + Math.sin(monster.orbitAngle) * monster.orbitRadius
    );

    const direction = new THREE.Vector3().subVectors(target, monster.position).normalize();
    monster.position.add(direction.multiplyScalar(0.03 + monster.speedOffset));

    if (monster.userData.knockback) {
      monster.position.add(monster.userData.knockback);
      monster.userData.knockback.multiplyScalar(0.9);

      if (monster.userData.knockback.lengthSq() < 0.0001) {
        monster.userData.knockback.set(0, 0, 0);
      }
    }

    if (monster.position.distanceTo(world.ship.position) < MONSTER_CONFIG.drainDistance) {
      state.fuel = Math.max(0, state.fuel - 0.005);
    }

    monster.scale.setScalar(1 + Math.sin(state.pulseTime * 5 + index) * 0.2);
    monster.material.opacity = 0.5 + Math.sin(state.pulseTime * 3 + index) * 0.3;
  });
}

function updatePlanetsAndRadar(state, world) {
  state.planets.forEach((planet, index) => {
    planet.angle += planet.speed;
    planet.mesh.position.x = planet.center.x + Math.cos(planet.angle) * planet.distance;
    planet.mesh.position.z = planet.center.z + Math.sin(planet.angle) * planet.distance;
    planet.mesh.position.y = Math.sin(planet.angle * 0.5) * 5;
    planet.mesh.rotation.y += 0.002;

    const mini = state.miniPlanets[index];
    if (mini) {
      mini.position.set(planet.mesh.position.x, 0, planet.mesh.position.z);
    }
  });

  world.shipDot.position.set(world.ship.position.x, 0, world.ship.position.z);
}

function updateParticles(state, world) {
  const positions = world.particles.geometry.attributes.position.array;

  for (let i = 0; i < world.particleCount; i += 1) {
    const base = world.particleBasePositions[i];
    const speed = world.particleSpeed[i];
    positions[i * 3] = base.x + Math.sin(state.pulseTime * speed * 5 + i) * 1.5;
    positions[i * 3 + 1] = base.y + Math.cos(state.pulseTime * speed * 3 + i) * 1.2;
    positions[i * 3 + 2] = base.z + Math.sin(state.pulseTime * speed * 4 + i) * 1.5;
  }

  world.particles.geometry.attributes.position.needsUpdate = true;
}

function updateStationEffects(state, world) {
  state.pulseTime += 0.05;
  world.stationLight.intensity = 2 + Math.sin(state.pulseTime) * 1.5 + state.warpFactor * 6;
  world.holoRing.material.opacity = 0.5 + Math.sin(state.pulseTime * 2) * 0.3;

  state.windowMaterials.forEach((mat, index) => {
    const pulse = Math.sin(state.pulseTime * 3) * 0.5 + 0.5;
    const hue = (index / state.windowMaterials.length + state.pulseTime * 0.1) % 1;
    const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
    mat.emissive.copy(color);
    mat.emissiveIntensity = 0.5 + pulse * 2;
  });

  state.landingLights.forEach((light, index) => {
    const pulse = Math.sin(state.pulseTime * 5 + index * 0.4) * 0.5 + 0.5;
    light.scale.setScalar(0.8 + pulse * 0.6);
  });
}

function updateDockGuidance(state, world) {
  const distance = world.ship.position.distanceTo(world.stationGroup.position);

  state.landingLights.forEach((light) => {
    if (distance < STATION_CONFIG.dockingDistance) {
      light.material.color.setRGB(0.2, 1, 0.4);
    } else if (distance < STATION_CONFIG.approachDistance) {
      light.material.color.setRGB(1, 0.7, 0.2);
    } else {
      light.material.color.setRGB(0.2, 0.8, 1);
    }
  });
}

function updateWorldTransitions(state, scene, world) {
  const jumpDistance = 3;
  const distance = world.ship.position.distanceTo(world.stationGroup.position);

  if (distance < jumpDistance && !state.quantumJump) {
    state.quantumJump = true;
    state.quantumProgress = 0;
    state.currentUniverse = 'quantum';
  }

  if (state.quantumJump) {
    state.quantumProgress += 0.01;
    const shake = 0.5 * (1 - state.quantumProgress);
    world.camera.position.x += (Math.random() - 0.5) * shake;
    world.camera.position.y += (Math.random() - 0.5) * shake;
    world.stationLight.intensity = 5 + state.quantumProgress * 20;

    if (state.quantumProgress >= 1) {
      state.quantumJump = false;
    }
  }

  const windowPosition = new THREE.Vector3(0, 2, 0);
  if (!state.inInterior && world.ship.position.distanceTo(windowPosition) < 3) {
    state.inInterior = true;
    world.stationGroup.visible = false;
    state.planets.forEach((planet) => (planet.mesh.visible = false));
    state.landingLights.forEach((light) => (light.visible = false));
    world.ship.position.set(0, 1, 5);
    scene.background = new THREE.Color(state.currentUniverse === 'quantum' ? 0x003311 : 0x000000);
    scene.fog = new THREE.Fog(0x1a0033, 40, 300);
  }
}

function updateCamera(state, world) {
  const desired = world.ship.position.clone().add(MOVEMENT_CONFIG.cameraOffset);
  world.camera.position.lerp(desired, MOVEMENT_CONFIG.cameraSmoothFactor);
  world.camera.lookAt(world.ship.position);

  world.scene.children.forEach((obj) => {
    if (obj instanceof THREE.Points && obj !== world.particles) {
      obj.rotation.y += 0.0001;
    }
  });

  const distance = world.ship.position.distanceTo(world.stationGroup.position);

  if (distance < STATION_CONFIG.warpStartDistance) {
    state.warpFactor =
      1 -
      THREE.MathUtils.clamp(
        (distance - STATION_CONFIG.warpMaxDistance) /
          (STATION_CONFIG.warpStartDistance - STATION_CONFIG.warpMaxDistance),
        0,
        1
      );
  } else {
    state.warpFactor *= 0.9;
  }

  const shake = state.warpFactor * 0.15;
  world.camera.position.x += (Math.random() - 0.5) * shake;
  world.camera.position.y += (Math.random() - 0.5) * shake;
  world.camera.position.z += (Math.random() - 0.5) * shake * 0.5;
}

function updateRefuelAndGravity(state, world) {
  const distToStation = world.ship.position.distanceTo(world.stationGroup.position);

  if (distToStation < STATION_CONFIG.refuelRadius) {
    state.fuel = Math.min(1, state.fuel + STATION_CONFIG.refuelSpeed * (1 / 60));
  }

  state.planets.forEach((planet) => {
    const direction = new THREE.Vector3().subVectors(planet.mesh.position, world.ship.position);
    const distance = direction.length();

    if (distance < 20) {
      direction.normalize();
      state.velocity.add(direction.multiplyScalar(0.0005 * (1 - distance / 20)));
    }
  });
}

export function updateGame({ state, world, hud }) {
  if (state.isPaused) {
    return;
  }

  state.explosionCooldown = Math.max(0, state.explosionCooldown - 1 / 60);

  updateSkyByTime(world.scene, world.galaxy);
  updateBullets(world.scene, state);
  updateShip(state, world, hud);
  updateMonsters(state, world);
  updatePlanetsAndRadar(state, world);
  updateParticles(state, world);
  updateStationEffects(state, world);
  updateDockGuidance(state, world);
  updateWorldTransitions(state, world.scene, world);
  updateRefuelAndGravity(state, world);
  updateCamera(state, world);
}
