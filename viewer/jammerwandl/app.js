import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const DATA_URL = '../../database/generated/routes_v1.json';
const MODEL_URL = '../../models/source/helenental/jammerwandl/realityscan/glb/jammerwandl-source-v1.glb';
const TEXTURED_MODEL_DIR = '../../models/source/helenental/jammerwandl/realityscan/obj-export/';
const TEXTURED_MTL_URL = `${TEXTURED_MODEL_DIR}jammegooooood.mtl`;
const TEXTURED_OBJ_URL = `${TEXTURED_MODEL_DIR}jammegooooood.obj`;
const colours = ['#36d7e7', '#ff6c58', '#f6c451'];
const viewer = document.querySelector('#viewer');
const status = document.querySelector('#model-status');
const routeListLeft = document.querySelector('#route-list-left');
const routeListRight = document.querySelector('#route-list-right');
const routeCount = document.querySelector('#route-count');
const search = document.querySelector('#route-search');
const dialog = document.querySelector('#route-dialog');

let routes = [];
let scene, camera, renderer, controls, model;

function stableKey(route) {
  return route.row_key || `${route.area}|${route.wall}|${route.route}`;
}

function showRoute(route, index) {
  document.querySelector('#dialog-name').textContent = route.route;
  document.querySelector('#dialog-grade').textContent = route.grade || 'Grade not recorded';
  document.querySelector('#dialog-details').innerHTML = [
    ['Topo number', index + 1], ['Area', route.area], ['Sector', route.wall],
    ['Discipline', route.discipline], ['Source', route.source || 'Master V1'],
    ['Record key', stableKey(route)]
  ].map(([term, value]) => `<dt>${term}</dt><dd>${value || '—'}</dd>`).join('');
  dialog.showModal();
  if (!model) return;
  const hue = new THREE.Color(colours[index % colours.length]);
  model.traverse((node) => {
    if (node.isMesh && node.material?.emissive) {
      node.material.emissive.copy(hue);
      node.material.emissiveIntensity = 0.12;
    }
  });
}

function renderRoutes() {
  const term = search.value.trim().toLowerCase();
  const visible = routes.filter((route) => `${route.route} ${route.grade}`.toLowerCase().includes(term));
  const renderList = (list, listRoutes) => list.replaceChildren(...listRoutes.map((route) => {
    const index = routes.indexOf(route);
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'route-card';
    button.type = 'button';
    button.dataset.routeKey = stableKey(route);
    button.innerHTML = `<span class="route-number" style="background:${colours[index % colours.length]}">${index + 1}</span><span class="route-name">${route.route}</span><strong class="grade">${route.grade || '—'}</strong>`;
    button.addEventListener('click', () => showRoute(route, index));
    li.append(button);
    return li;
  }));
  const split = Math.ceil(visible.length / 2);
  renderList(routeListLeft, visible.slice(0, split));
  renderList(routeListRight, visible.slice(split));
}

async function loadRoutes() {
  try {
    const response = await fetch(DATA_URL);
    const data = await response.json();
    routes = data.routes.filter((route) => route.area === 'Helenental' && route.wall === 'Jammerwandl');
    routeCount.textContent = routes.length;
    renderRoutes();
  } catch (error) {
    routeListLeft.innerHTML = '<li class="verification-note">Route data could not load. Start a local web server from the repository root.</li>';
    routeListRight.replaceChildren();
    console.error(error);
  }
}

function initViewer() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#cad8c7', 75, 190);
  camera = new THREE.PerspectiveCamera(38, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
  camera.position.set(45, 22, 58);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewer.append(renderer.domElement);
  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 4.25;
  controls.zoomSpeed = 1.15;
  controls.panSpeed = 0.7;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.08;
  controls.target.set(0, 0, 5);
  scene.add(new THREE.HemisphereLight('#ffffff', '#78917e', 4.8));
  const key = new THREE.DirectionalLight('#ffffff', 5.2);
  key.position.set(24, 38, 30);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#9dc8ff', 2.6);
  fill.position.set(-30, 14, -28);
  scene.add(fill);
  scene.add(new THREE.GridHelper(100, 20, '#90aa93', '#b8cbbc'));

  function frameModel(sourceModel, textured) {
    model = sourceModel;
    model.traverse((node) => {
      if (!node.isMesh) return;
      if (textured && node.material) {
        node.material.side = THREE.DoubleSide;
        if (node.material.map) node.material.map.colorSpace = THREE.SRGBColorSpace;
      } else {
        node.material = new THREE.MeshStandardMaterial({
          color: '#edf3e9', vertexColors: Boolean(node.geometry?.getAttribute('color')),
          roughness: 0.72, metalness: 0.04, side: THREE.DoubleSide
        });
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const fit = 42 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(fit);
    scene.add(model);
    controls.target.set(0, 0, 0);
    status.textContent = textured
      ? 'Textured 3D wall loaded · free rotation enabled'
      : 'GLB fallback loaded · texture package unavailable';
  }

  function loadGlbFallback() {
    new GLTFLoader().load(MODEL_URL, (gltf) => frameModel(gltf.scene, false), undefined, () => {
      status.textContent = 'Could not load a 3D model — use the local server URL';
    });
  }

  status.textContent = 'Loading textured RealityScan model…';
  new MTLLoader().load(TEXTURED_MTL_URL, (materials) => {
    materials.preload();
    new OBJLoader().setMaterials(materials).load(
      TEXTURED_OBJ_URL,
      (object) => frameModel(object, true),
      (event) => {
        if (!event.total) return;
        status.textContent = `Loading textured model ${Math.round((event.loaded / event.total) * 100)}%`;
      },
      loadGlbFallback
    );
  }, undefined, loadGlbFallback);

  window.addEventListener('resize', () => {
    camera.aspect = viewer.clientWidth / viewer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
    controls.handleResize();
  });
  (function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); })();
}

document.querySelector('#reset-view').addEventListener('click', () => {
  camera.position.set(45, 22, 58);
  controls.target.set(0, 0, 0);
  if (model) model.traverse((node) => { if (node.isMesh && node.material?.emissive) node.material.emissiveIntensity = 0; });
});
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
search.addEventListener('input', renderRoutes);
initViewer();
loadRoutes();
