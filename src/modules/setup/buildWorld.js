import { THREE } from '../core/three.js';
import { MONSTER_CONFIG } from '../config/gameConfig.js';

function createStars(count, size) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 1) {
    positions[i] = (Math.random() - 0.5) * 500;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size, color: 0xffffff })
  );
}

function createGalaxy(scene) {
  const galaxyGeo = new THREE.BufferGeometry();
  const galaxyCount = 800;
  const positions = new Float32Array(galaxyCount * 3);
  const colors = [];

  for (let i = 0; i < galaxyCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 400;

    const c = new THREE.Color(0.5 + Math.random() * 0.5, 0.2 + Math.random() * 0.4, 1);
    colors.push(c.r, c.g, c.b);
  }

  galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  galaxyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const galaxy = new THREE.Points(
    galaxyGeo,
    new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    })
  );

  scene.add(galaxy);
  return galaxy;
}

function createStation(scene, state) {
  const stationGroup = new THREE.Group();
  scene.add(stationGroup);

  const holoRing = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.1, 16, 100),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 })
  );
  holoRing.rotation.x = Math.PI / 2;
  stationGroup.add(holoRing);

  const stationLight = new THREE.PointLight(0xaa66ff, 3, 200);
  stationGroup.add(stationLight);

  const windowsGroup = new THREE.Group();
  const rings = 12;
  const windowsPerRing = 10;
  const radius = 2.2;

  for (let r = 0; r < rings; r += 1) {
    const zPos = -4 + r * 1.2;

    for (let i = 0; i < windowsPerRing; i += 1) {
      const angle = (i / windowsPerRing) * Math.PI * 2;
      const windowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0x66ccff,
          emissive: 0x66ccff,
          emissiveIntensity: 1.5,
        })
      );

      windowMesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, zPos);
      windowsGroup.add(windowMesh);
      state.windowMaterials.push(windowMesh.material);
    }
  }

  stationGroup.add(windowsGroup);

  const landingGroup = new THREE.Group();
  stationGroup.add(landingGroup);

  for (let i = 0; i < 70; i += 1) {
    const lightMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    lightMesh.position.set(0, -1.5, -10 + i * 2);
    landingGroup.add(lightMesh);
    state.landingLights.push(lightMesh);
  }

  return { stationGroup, stationLight, holoRing };
}

function createPlanets(scene, stationGroup, state) {
  const planetConfigs = [
    { size: 1.5, distance: 40, speed: 0.002, color: 0x3366ff },
    { size: 2.2, distance: 60, speed: 0.0015, color: 0xff8844 },
    { size: 1.2, distance: 30, speed: 0.003, color: 0x88ffcc },
  ];

  planetConfigs.forEach(({ size, distance, speed, color }) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 64, 64),
      new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 })
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.2, 32, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15 })
    );

    mesh.add(glow);
    scene.add(mesh);

    state.planets.push({
      mesh,
      distance,
      speed,
      angle: Math.random() * Math.PI * 2,
      center: stationGroup.position,
    });
  });
}

function createMonsters(scene, state) {
  for (let i = 0; i < MONSTER_CONFIG.count; i += 1) {
    const monster = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff0033,
        emissive: 0x550011,
        roughness: 0.8,
        transparent: true,
        opacity: 0.8,
      })
    );

    monster.position.set((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
    monster.speedOffset = Math.random() * 0.02;
    monster.orbitAngle = Math.random() * Math.PI * 2;
    monster.orbitRadius = 6 + Math.random() * 4;

    scene.add(monster);
    state.monsters.push(monster);
  }
}

function createShip(scene) {
  const ship = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 2, 32),
    new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      emissive: 0x112244,
      metalness: 0.6,
      roughness: 0.3,
    })
  );

  ship.position.set(0, 0, 25);
  scene.add(ship);
  return ship;
}

function createParticles(stationGroup) {
  const particleCount = 100;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const basePositions = [];
  const speeds = [];

  for (let i = 0; i < particleCount; i += 1) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    basePositions.push({ x, y, z });
    speeds.push(Math.random() * 0.01 + 0.005);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0x66ccff,
      size: 0.2,
      transparent: true,
      opacity: 0.7,
    })
  );

  stationGroup.add(particles);

  return { particles, particleCount, particleBasePositions: basePositions, particleSpeed: speeds };
}

function setupMiniMap(miniScene, state, stationGroup, ship) {
  const radar = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 })
  );
  radar.rotation.x = -Math.PI / 2;
  miniScene.add(radar);

  const shipDot = new THREE.Mesh(
    new THREE.SphereGeometry(2, 8, 3),
    new THREE.MeshBasicMaterial({ color: 0xff00ff })
  );
  miniScene.add(shipDot);

  miniScene.add(stationGroup.clone());

  state.planets.forEach((planet) => {
    const clone = planet.mesh.clone();
    miniScene.add(clone);
    state.miniPlanets.push(clone);
  });

  return { shipDot };
}

export function buildWorld(scene, miniScene, state) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(15, 50, 50);
  scene.add(dirLight);

  scene.add(createStars(2000, 0.5));
  scene.add(createStars(400, 1.2));

  const galaxy = createGalaxy(scene);
  const { stationGroup, stationLight, holoRing } = createStation(scene, state);

  createPlanets(scene, stationGroup, state);
  createMonsters(scene, state);

  const ship = createShip(scene);
  const particlesData = createParticles(stationGroup);
  const miniMapData = setupMiniMap(miniScene, state, stationGroup, ship);

  return {
    galaxy,
    stationGroup,
    stationLight,
    holoRing,
    ship,
    shipDot: miniMapData.shipDot,
    ...particlesData,
  };
}
