import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

// Initialize renderer to canvas and add a scene
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#canvas"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( render );

const scene = new THREE.Scene();

// Create camera and add orbit controls
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 15, 15);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.maxDistance = 100;
controls.minDistance = 12;
controls.update();


// Add objects to scene
const geometry = new THREE.IcosahedronGeometry(10, 20);
const material = new THREE.MeshNormalMaterial({ wireframe: false, flatShading: true, side: THREE.DoubleSide });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
const pos = geometry.attributes.position;
const normal = geometry.attributes.normal;
const noise = new SimplexNoise();
const smoothness = 0.2;
const height = 1;

for (let i=0; i<pos.count; i++)
{
  const value = noise.noise3d(
    pos.getX(i)*smoothness,
    pos.getY(i)*smoothness,
    pos.getZ(i)*smoothness)-0.5;

  pos.setXYZ(
    i,
    pos.getX(i) + normal.getX(i) * value * height,
    pos.getY(i) + normal.getY(i) * value * height,
    pos.getZ(i) + normal.getZ(i) * value * height
  );
}
pos.needsUpdate = true;
geometry.computeVertexNormals();


// Render scene
function render() {
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);
