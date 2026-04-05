import { THREE } from '../core/three.js';

export function setupScene(miniMapElement) {
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

  const miniScene = new THREE.Scene();
  const miniCamera = new THREE.OrthographicCamera(-70, 70, 70, -70, 0.1, 500);
  miniCamera.position.set(0, 100, 0);
  miniCamera.lookAt(0, 0, 0);

  const miniRenderer = new THREE.WebGLRenderer({ alpha: true });
  miniRenderer.setSize(220, 140);
  miniRenderer.setPixelRatio(window.devicePixelRatio);
  miniRenderer.domElement.style.display = 'block';
  miniMapElement.appendChild(miniRenderer.domElement);

  return { scene, camera, renderer, miniScene, miniCamera, miniRenderer };
}
