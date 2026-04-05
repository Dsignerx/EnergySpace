import './style.css';
import { createGameState } from './modules/state/createGameState.js';
import { setupScene } from './modules/setup/setupScene.js';
import { buildWorld } from './modules/setup/buildWorld.js';
import { setupInput } from './modules/systems/setupInput.js';
import { setupHud } from './modules/ui/setupHud.js';
import { updateGame } from './modules/systems/updateGame.js';

const hud = setupHud();
const state = createGameState();

const sceneData = setupScene(hud.miniMap);
const worldData = buildWorld(sceneData.scene, sceneData.miniScene, state);

const world = {
  ...sceneData,
  ...worldData,
};

setupInput(state, world, world.scene, hud);

function renderFrame() {
  world.renderer.render(world.scene, world.camera);
  world.miniRenderer.render(world.miniScene, world.miniCamera);
}

function animate() {
  requestAnimationFrame(animate);
  updateGame({ state, world, hud });
  renderFrame();
}

animate();

window.addEventListener('resize', () => {
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(window.innerWidth, window.innerHeight);
});
