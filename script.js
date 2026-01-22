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
controls.minDistance = 5;
controls.update();


// Add objects to scene
const terrain = new THREE.Mesh();
scene.add(terrain);
const water = new THREE.Mesh();
scene.add(water);

const noise = new SimplexNoise();
let height = document.getElementById("height").value;
let scale = document.getElementById("scale").value;
let detail = document.getElementById("detail").value;
let octave = document.getElementById("octave").value;
let water_level = document.getElementById("water_level").value;

function updateMesh()
{
  // Terrain
  const material = new THREE.MeshNormalMaterial({ flatShading: true });
  const geometry = new THREE.IcosahedronGeometry(10, Math.round(detail));
  let pos = geometry.attributes.position;
  let normal = geometry.attributes.normal;
  
  for (let i=0; i<pos.count; i++)
  {
    for (let j=1; j<=octave; j++)
    {
      const value = noise.noise3d(
        pos.getX(i)*scale*j,
        pos.getY(i)*scale*j,
        pos.getZ(i)*scale*j)-0.5;
      pos.setXYZ(
        i,
        pos.getX(i) + normal.getX(i) * value * height/(j*j),
        pos.getY(i) + normal.getY(i) * value * height/(j*j),
        pos.getZ(i) + normal.getZ(i) * value * height/(j*j)
      );
    }
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  terrain.geometry = geometry;
  terrain.material = material;
  
  // Water
  const water_geometry = new THREE.IcosahedronGeometry(10 + parseFloat(water_level), Math.round(detail));
  const water_material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  water.geometry = water_geometry;
  water.material = water_material;
}
updateMesh();

document.getElementById("height").addEventListener("input", (event) => {height = document.getElementById("height").value;updateMesh();});
document.getElementById("scale").addEventListener("input", (event) => {scale = document.getElementById("scale").value;updateMesh();});
document.getElementById("detail").addEventListener("input", (event) => {detail = document.getElementById("detail").value;updateMesh();});
document.getElementById("octave").addEventListener("input", (event) => {octave = document.getElementById("octave").value;updateMesh();});
document.getElementById("water_level").addEventListener("input", (event) => {water_level = document.getElementById("water_level").value;updateMesh();});

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
