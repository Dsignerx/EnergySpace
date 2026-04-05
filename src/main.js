import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// =================== VARIABLES ===================
let velocity = new THREE.Vector3();
let shakeAmount = 0;
let shakeDecay = 0.9;
let shakeIntensity = 0.15;
let acceleration = 0.053;
let damping = 0.95;
let stationGroup,
  ship,
  pulseTime = 0;
let galaxy = null,
  particles = null;
let warpFactor = 0;
const warpStartDistance = 40;
const warpMaxDistance = 10;
const cameraOffset = new THREE.Vector3(0, 2, 15); // cámara un poco más atrás
const smoothFactor = 0.055;
const dockingDistance = 25;
const approachDistance = 60;
let ammo = 5;
ammo += 10;

//Ataque simple

//funcion shoot
window.addEventListener('click', shoot);

function shoot() {
  if (ammo <= 0) {
    console.log('Sin balas 💀');
    return;
  }

  ammo--;

  createBullet();
}

//crear bala

const bullets = [];

function createBullet() {
  const geo = new THREE.SphereGeometry(0.15, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

  const bullet = new THREE.Mesh(geo, mat);

  // sale desde la nave
  bullet.position.copy(ship.position);

  // dirección hacia adelante
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(ship.quaternion);

  bullet.userData.velocity = direction.multiplyScalar(1.5);

  scene.add(bullet);
  bullets.push(bullet);
}

//

let fuel = 1.0;
const fuelDuration = 20; // segundos para vaciar tanque

let inInterior = false; //new world :D

let currentUniverse = 'normal';

let quantumJump = false; // distorsion
let quantumProgress = 0;

const keys = {
  left: false,
  right: false,
  forward: false,
  backward: false,
  up: false,
  down: false,
};
window.addEventListener('keydown', (e) => {
  if (e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'ArrowUp') keys.forward = true;
  if (e.key === 'ArrowDown') keys.backward = true;
  if (e.key === 'w') keys.up = true;
  if (e.key === 's') keys.down = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'ArrowUp') keys.forward = false;
  if (e.key === 'ArrowDown') keys.backward = false;
  if (e.key === 'w') keys.up = false;
  if (e.key === 's') keys.down = false;
});

// =================== ESCENA ===================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 4, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ===== RADAR =====

const miniScene = new THREE.Scene();

const miniCamera = new THREE.OrthographicCamera(-70, 70, 70, -70, 0.1, 500);

miniCamera.position.set(0, 100, 0);
miniCamera.lookAt(0, 0, 0);

const miniRenderer = new THREE.WebGLRenderer({ alpha: true });
miniRenderer.setSize(220, 140); // ajusta al tamaño REAL del contenedor
miniRenderer.setPixelRatio(window.devicePixelRatio);

document.getElementById('miniMap').appendChild(miniRenderer.domElement);

miniRenderer.domElement.style.display = 'block';

//===fondo radar=======

const radarGeo = new THREE.CircleGeometry(20, 64);

const radarMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.2,
});

const radar = new THREE.Mesh(radarGeo, radarMat);
radar.rotation.x = -Math.PI / 2;

miniScene.add(radar);

radar.position.set(0, 0, 0);
miniCamera.lookAt(0, 0, 0);

//===nave-mini======

const shipDot = new THREE.Mesh(
  new THREE.SphereGeometry(2, 8, 3),
  new THREE.MeshBasicMaterial({ color: 0xff00ff })
);

miniScene.add(shipDot);

// =================== LUCES ===================
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(15, 50, 50);
scene.add(dirLight);

// =================== ESTRELLAS ===================
function createStars(count, size) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 500; // reducido a 500 para que se vean
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size: size, color: 0xffffff });
  return new THREE.Points(geo, mat);
}
scene.add(createStars(2000, 0.5));
scene.add(createStars(400, 1.2));

// =================== GALAXIA ===================
const galaxyGeo = new THREE.BufferGeometry();
const galaxyCount = 800;
const galaxyPositions = new Float32Array(galaxyCount * 3);
const galaxyColors = [];
for (let i = 0; i < galaxyCount; i++) {
  galaxyPositions[i * 3] = (Math.random() - 0.5) * 400;
  galaxyPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
  galaxyPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
  const c = new THREE.Color(
    0.5 + Math.random() * 0.5,
    0.2 + Math.random() * 0.4,
    1
  );
  galaxyColors.push(c.r, c.g, c.b);
}
galaxyGeo.setAttribute(
  'position',
  new THREE.BufferAttribute(galaxyPositions, 3)
);
galaxyGeo.setAttribute(
  'color',
  new THREE.Float32BufferAttribute(galaxyColors, 3)
);
galaxy = new THREE.Points(
  galaxyGeo,
  new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  })
);
scene.add(galaxy);

// =================== ESTACIÓN ===================
stationGroup = new THREE.Group();
stationGroup.position.set(0, 0, 0); // centramos la estación
scene.add(stationGroup);

// holograma anillo
const holoGeometry = new THREE.TorusGeometry(16, 0.1, 16, 100);
const holoMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.7,
});
const holoRing = new THREE.Mesh(holoGeometry, holoMaterial);
holoRing.rotation.x = Math.PI / 2;
stationGroup.add(holoRing);

// luz de estación
const stationLight = new THREE.PointLight(0x66ccff, 2, 200);
stationLight.color.set(0xaa66ff);
stationLight.intensity = 3;
stationLight.position.set(0, 0, 0);
stationGroup.add(stationLight);

// ===== PLANETAS =====

const planets = [];

function createPlanet(size, distance, speed, color) {
  const geo = new THREE.SphereGeometry(size, 64, 64);

  const mat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 1,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geo, mat);

  // glow atmosférico
  const glowGeo = new THREE.SphereGeometry(size * 1.2, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.15,
  });

  const glow = new THREE.Mesh(glowGeo, glowMat);
  mesh.add(glow);

  scene.add(mesh);

  planets.push({
    mesh,
    distance,
    speed,
    angle: Math.random() * Math.PI * 2,
  });
}

// algunos planetas
createPlanet(1.5, 40, 0.002, 0x3366ff);
createPlanet(2.2, 60, 0.0015, 0xff8844);
createPlanet(1.2, 30, 0.003, 0x88ffcc);

// ================= MINI MAP CLONES =================

const stationMini = stationGroup.clone();
miniScene.add(stationMini);

const miniPlanets = [];
const miniMonsters = [];

planets.forEach((p) => {
  const clone = p.mesh.clone();
  miniScene.add(clone);
  miniPlanets.push(clone);
});

//=====================MONSTROUS===================

let monsters = [];

function createMonster() {
  const geo = new THREE.SphereGeometry(1.2, 32, 32);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xff0033,
    emissive: 0x550011,
    roughness: 0.8,
    transparent: true,
    opacity: 0.8,
  });

  const monster = new THREE.Mesh(geo, mat);

  // posición aleatoria
  monster.position.set(
    (Math.random() - 0.5) * 80,
    0,
    (Math.random() - 0.5) * 80
  );

  // variación de velocidad
  monster.speedOffset = Math.random() * 0.02;

  scene.add(monster);

  monsters.push(monster);

  monster.orbitAngle = Math.random() * Math.PI * 2;
  monster.orbitRadius = 6 + Math.random() * 4;
}

for (let i = 0; i < 5; i++) {
  createMonster();
}

// =================== VENTANAS ===================
const windowsGroup = new THREE.Group();
const windowMaterials = []; // guardamos los materiales
const rings = 12,
  windowsPerRing = 10,
  radius = 2.2;

for (let r = 0; r < rings; r++) {
  const zPos = -4 + r * 1.2;
  for (let i = 0; i < windowsPerRing; i++) {
    const angle = (i / windowsPerRing) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const winGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      emissive: 0x66ccff,
      emissiveIntensity: 1.5,
    });

    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(x, y, zPos);
    win.lookAt(x * 2, y * 2, zPos);

    windowsGroup.add(win);
    windowMaterials.push(winMat); // <-- guardamos para el pulso deluxe
  }
}

stationGroup.add(windowsGroup);

// ===== LUCES GUÍA DE ATERRIZAJE =====

const landingLights = [];
const landingGroup = new THREE.Group();
stationGroup.add(landingGroup);

const lightCount = 70;
const spacing = 2;

for (let i = 0; i < lightCount; i++) {
  const geo = new THREE.SphereGeometry(0.12, 8, 8);

  const mat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });

  const lightMesh = new THREE.Mesh(geo, mat);

  // línea hacia el centro de docking
  lightMesh.position.set(0, -1.5, -10 + i * spacing);

  landingGroup.add(lightMesh);

  landingLights.push(lightMesh);
}

// =================== NAVE ===================
const shipGeo = new THREE.SphereGeometry(0.6, 2, 32);
const shipMat = new THREE.MeshStandardMaterial({
  color: 0x66ccff,
  emissive: 0x112244,
  metalness: 0.6,
  roughness: 0.3,
});
ship = new THREE.Mesh(shipGeo, shipMat);
ship.position.set(0, 0, 25);
scene.add(ship);

// =================== PARTÍCULAS ===================
const particleCount = 100;
const particleGeo = new THREE.BufferGeometry();
const posArr = new Float32Array(particleCount * 3);
const particleSpeed = [];
const particleBasePositions = []; //

for (let i = 0; i < particleCount; i++) {
  const x = (Math.random() - 0.5) * 20;
  const y = (Math.random() - 0.5) * 20;
  const z = (Math.random() - 0.5) * 20;

  posArr[i * 3] = x;
  posArr[i * 3 + 1] = y;
  posArr[i * 3 + 2] = z;

  particleBasePositions.push({ x, y, z });

  particleSpeed.push(Math.random() * 0.01 + 0.005);
}

if (particles) {
  const positions = particles.geometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 2] -= warpFactor * 0.5;
  }

  particles.geometry.attributes.position.needsUpdate = true;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0x66ccff,
  size: 0.2,
  transparent: true,
  opacity: 0.7,
});
particles = new THREE.Points(particleGeo, particleMat);
stationGroup.add(particles);

// =================================== UPDATE ================================================
function update() {
  // rotación galaxia y estrellas
  scene.children.forEach((obj) => {
    if (obj instanceof THREE.Points && obj !== particles)
      obj.rotation.y += 0.0001;
  });

  //Ataque simple

  bullets.forEach((b, i) => {
    b.position.add(b.userData.velocity);

    // eliminar si se va lejos
    if (b.position.length() > 500) {
      scene.remove(b);
      bullets.splice(i, 1);
    }
  });

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    for (let j = monsters.length - 1; j >= 0; j--) {
      const m = monsters[j];

      const dist = b.position.distanceTo(m.position);

      if (dist < 1.2) {
        // eliminar monstruo
        scene.remove(m);
        monsters.splice(j, 1);

        // eliminar bala
        scene.remove(b);
        bullets.splice(i, 1);

        break; // clave: ya eliminaste esa bala
      }
    }
  }

  // ===== animación luces guía =====

  landingLights.forEach((light, i) => {
    const pulse = Math.sin(pulseTime * 5 + i * 0.4) * 0.5 + 0.5;

    light.scale.setScalar(0.8 + pulse * 0.6);
  });

  // nave
  if (ship) {
    if (fuel > 0) {
      if (keys.left) velocity.x -= acceleration;
      if (keys.right) velocity.x += acceleration;
      if (keys.forward) velocity.z -= acceleration;
      if (keys.backward) velocity.z += acceleration;
      if (keys.up) velocity.y += acceleration;
      if (keys.down) velocity.y -= acceleration;
    }

    velocity.multiplyScalar(damping);

    // detectar movimiento real
    const speed = velocity.length();
    const moving = speed > 0.001;

    if (moving && fuel > 0) {
      fuel -= (1 / fuelDuration) * (1 / 60);
      fuel = Math.max(fuel, 0);
    }

    // HUD

    if (fuelLevel && fuelText) {
      fuelLevel.style.width = fuel * 100 + '%';
      fuelText.textContent = Math.round(fuel * 100) + '%';
    }

    ship.position.add(velocity);

    ship.rotation.z = -velocity.x * 2;
    ship.rotation.x = velocity.z * 2;
  }

  // ===== cámara seguidora =====
  const offset = cameraOffset.clone();
  const desiredPos = ship.position.clone().add(offset);

  // seguir nave suave
  camera.position.lerp(desiredPos, smoothFactor);
  camera.lookAt(ship.position);

  // ===== SHAKE DOCKING =====

  // distancia a estación
  let warpFactor = 0;

  if (stationGroup) {
    const dist = ship.position.distanceTo(stationGroup.position);

    // activa efecto cerca de estación
    warpFactor = Math.max(0, 1 - dist / 20);

    //distorsion
    const jumpDistance = 3;

    if (ship && stationGroup) {
      const dist = ship.position.distanceTo(stationGroup.position);

      if (dist < jumpDistance && !quantumJump) {
        quantumJump = true;
        quantumProgress = 0;
        currentUniverse = 'quantum';
      }
    }
  }

  //Mounstruo

  monsters.forEach((monster, index) => {
    monster.orbitRadius *= 0.999;
    monster.orbitRadius = Math.max(monster.orbitRadius, 2);

    // giran alrededor del jugador
    monster.orbitAngle += 0.01 + monster.speedOffset;

    const targetX =
      ship.position.x + Math.cos(monster.orbitAngle) * monster.orbitRadius;
    const targetZ =
      ship.position.z + Math.sin(monster.orbitAngle) * monster.orbitRadius;
    const targetY = ship.position.y;

    const target = new THREE.Vector3(targetX, targetY, targetZ);

    const dir = new THREE.Vector3();
    dir.subVectors(target, monster.position);

    const distance = dir.length();

    dir.normalize();

    // velocidad suave hacia su posición orbital
    const speed = 0.03 + monster.speedOffset;

    monster.position.add(dir.multiplyScalar(speed));

    // si estás muy cerca → colapsan hacia mi
    const distToShip = monster.position.distanceTo(ship.position);

    if (distToShip < 3) {
      fuel -= 0.005;
      fuel = Math.max(fuel, 0);
    }

    // animación viva
    monster.scale.setScalar(1 + Math.sin(pulseTime * 5 + index) * 0.2);
    monster.material.opacity = 0.5 + Math.sin(pulseTime * 3 + index) * 0.3;
  });

  // funcion obtener hora mundo real

  const hour = new Date().getHours();

  function updateWorldByTime() {
    const hour = new Date().getHours();

    const isDay = hour >= 6 && hour < 18;

    if (isDay) {
      // ☀️ DÍA
      scene.background = new THREE.Color(0x0a0f1f);

      galaxy.material.opacity = 0.4;

      scene.fog = new THREE.Fog(0x0a0f1f, 100, 600);

      scene.fog = isDay
        ? new THREE.Fog(0x0a0f1f, 100, 600)
        : new THREE.Fog(0x000000, 30, 200);
    } else {
      // 🌙 NOCHE
      scene.background = new THREE.Color(0x000000);

      galaxy.material.opacity = 0.9;

      scene.fog = new THREE.Fog(0x000000, 40, 300);
    }
  }

  updateWorldByTime();

  // intensidad shake
  const shakeWarp = warpFactor * 0.15;

  // vibración suave
  camera.position.x += (Math.random() - 0.5) * shakeWarp;
  camera.position.y += (Math.random() - 0.5) * shakeWarp;
  camera.position.z += (Math.random() - 0.5) * shakeWarp * 0.5;

  // pulso estación
  pulseTime += 0.05;
  stationLight.intensity = 2 + Math.sin(pulseTime) * 1.5 + warpFactor * 6;
  holoRing.material.opacity = 0.5 + Math.sin(pulseTime * 2) * 0.3;

  // =================== pulso arcoíris en ventanas ===================
  if (windowMaterials && windowMaterials.length > 0) {
    const pulse = Math.sin(pulseTime * 3) * 0.5 + 0.5; // 0 a 1
    const hueOffset = pulseTime * 0.1; // hace girar los colores suavemente
    windowMaterials.forEach((mat, i) => {
      // calculamos un matiz diferente por ventana para más dinamismo
      const hue = (i / windowMaterials.length + hueOffset) % 1;
      const color = new THREE.Color();
      color.setHSL(hue, 0.7, 0.5); // saturación 70%, luz 50%
      mat.emissive.copy(color);
      mat.emissiveIntensity = 0.5 + pulse * 2;
    });
  }

  const windowPosition = new THREE.Vector3(0, 2, 0); // enter the new dimension :D
  const distToWindow = ship.position.distanceTo(windowPosition);

  if (distToWindow < 3 && !inInterior) {
    enterInterior();
  }

  function enterInterior() {
    inInterior = true;

    // ocultar estación
    stationGroup.visible = false;
    planets.forEach((p) => (p.mesh.visible = false));
    landingLights.forEach((l) => (l.visible = false));

    // mover nave a nuevo mundo
    ship.position.set(0, 1, 5);

    // cambiar fondo
    if (currentUniverse === 'normal') {
      scene.background = new THREE.Color(0x000000);
    }

    if (currentUniverse === 'quantum') {
      scene.background = new THREE.Color(0x003311); // púrpura oscuro profundo
    }

    // niebla suave para profundidad
    scene.fog = new THREE.Fog(0x1a0033, 40, 300);

    console.log('Entered new reality');
  }

  // =================== movimiento suave de partículas ===================
  if (particles) {
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const base = particleBasePositions[i];
      const speed = particleSpeed[i];

      // movimiento oscilante suave
      positions[i * 3] = base.x + Math.sin(pulseTime * speed * 5 + i) * 1.5;
      positions[i * 3 + 1] = base.y + Math.cos(pulseTime * speed * 3 + i) * 1.2;
      positions[i * 3 + 2] = base.z + Math.sin(pulseTime * speed * 4 + i) * 1.5;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }

  // mover planetas alrededor de la estación
  planets.forEach((p) => {
    p.angle += p.speed;

    p.mesh.position.x =
      stationGroup.position.x + Math.cos(p.angle) * p.distance;
    p.mesh.position.z =
      stationGroup.position.z + Math.sin(p.angle) * p.distance;
    p.mesh.position.y = Math.sin(p.angle * 0.5) * 5; // leve flotación
    p.mesh.rotation.y += 0.002;
  });

  // ===== RADAR UPDATE =====

  planets.forEach((p, i) => {
    miniPlanets[i].position.x = p.mesh.position.x;
    miniPlanets[i].position.z = p.mesh.position.z;
    miniPlanets[i].position.y = 0;
  });

  shipDot.position.x = ship.position.x;
  shipDot.position.z = ship.position.z;
  shipDot.position.y = 0;

  // ===== gravedad planetaria suave =====
  planets.forEach((p) => {
    const direction = new THREE.Vector3();
    direction.subVectors(p.mesh.position, ship.position);

    const distance = direction.length();

    if (distance < 20) {
      direction.normalize();

      const strength = 0.0005 * (1 - distance / 20);

      velocity.add(direction.multiplyScalar(strength));
    }
  });

  // distancia a estación
  const distToStation = ship.position.distanceTo(stationGroup.position);

  // ===== RECARGA GASOLINA =====
  const refuelRadius = 18;
  const refuelSpeed = 0.5;

  if (distToStation < refuelRadius) {
    fuel += refuelSpeed * (1 / 60);
    fuel = Math.min(fuel, 1);
  }

  // calcular warp progresivo
  if (distToStation < warpStartDistance) {
    const t =
      1 -
      THREE.MathUtils.clamp(
        (distToStation - warpMaxDistance) /
          (warpStartDistance - warpMaxDistance),
        0,
        1
      );

    warpFactor = t;
  } else {
    warpFactor *= 0.9;
  }

  if (ship && stationGroup) {
    const distance = ship.position.distanceTo(stationGroup.position);

    landingLights.forEach((light) => {
      const mat = light.material;

      if (distance < dockingDistance) {
        // DOCKING READY → verde pulsante
        const pulse = Math.sin(pulseTime * 8) * 0.5 + 0.5;
        mat.color.setRGB(0.2, 1, 0.4);
        light.scale.setScalar(1 + pulse * 0.8);
      } else if (distance < approachDistance) {
        // aproximación → ámbar
        mat.color.setRGB(1, 0.7, 0.2);
        light.scale.setScalar(1);
      } else {
        // lejos → azul
        mat.color.setRGB(0.2, 0.8, 1);
        light.scale.setScalar(0.9);
      }
    });
  }
  //transicion portal
  if (quantumJump) {
    quantumProgress += 0.01;

    // cámara vibra fuerte
    const shake = 0.5 * (1 - quantumProgress);
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake;

    // subir intensidad de luz estación
    stationLight.intensity = 5 + quantumProgress * 20;

    // cuando termina → cambiar universo
    if (quantumProgress >= 1) {
      // universo verde sin logs
      quantumJump = false;
    }
  }
}

//==UI experiencia===============

const panel = document.getElementById('commandPanel');
const toggleBtn = document.getElementById('toggleDock');
const content = document.getElementById('dockContent');

toggleBtn.addEventListener('click', () => {
  panel.classList.toggle('collapsed');

  const isCollapsed = panel.classList.contains('collapsed');

  content.style.display = isCollapsed ? 'none' : 'block';

  toggleBtn.textContent = isCollapsed ? 'Abrir Dock' : '—';
});

//WIDGETS//

document.addEventListener("DOMContentLoaded", () => {

  const widgetToggle = document.getElementById("widgetToggle")
  const widgetContainer = document.getElementById("widgetContainer")

  if (!widgetToggle || !widgetContainer) {
    console.log("No existe el widget aún")
    return
  }

  widgetToggle.addEventListener("click", () => {

    widgetContainer.classList.toggle("active")

    if (widgetContainer.classList.contains("active")) {
      widgetToggle.textContent = "▼"
    } else {
      widgetToggle.textContent = "▲"
    }

  })

})

// =================== RENDER & ANIMATE ==================
function render() {
  renderer.render(scene, camera);
}
function animate() {
  requestAnimationFrame(animate);
  update();
  render();
  miniRenderer.render(miniScene, miniCamera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
