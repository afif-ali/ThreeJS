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
controls.minDistance = 15;
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
let render_mode = document.getElementById("render_mode").value;


function updateMesh()
{
  // Terrain
  const terrain_geometry = new THREE.IcosahedronGeometry(10, Math.round(detail));
  let pos = terrain_geometry.attributes.position;
  let normal = terrain_geometry.attributes.normal;
  
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
  terrain_geometry.computeVertexNormals();
  terrain.geometry = terrain_geometry;
  
  // Water
  const water_geometry = new THREE.IcosahedronGeometry(10 + parseFloat(water_level), Math.round(detail));
  water.geometry = water_geometry;

  // Materials
  let terrain_material;
  let water_material;

  if (render_mode == "lit") {
    terrain_material = new THREE.MeshPhongMaterial({ flatShading: true });
    water_material = new THREE.MeshPhongMaterial({ flatShading: true });
  }
  else if (render_mode == "normal") {
    terrain_material = new THREE.MeshNormalMaterial({ flatShading: true });
    water_material = new THREE.MeshNormalMaterial({ flatShading: true });
  }
  else if (render_mode == "flat") {
    terrain_material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });
    water_material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: false });
  }
  else if (render_mode == "wireframe") {
    terrain_material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    water_material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
  }

  terrain.material = terrain_material;
  water.material = water_material;
}
updateMesh();

document.getElementById("height").addEventListener("input", (event) => {height = document.getElementById("height").value;updateMesh();});
document.getElementById("scale").addEventListener("input", (event) => {scale = document.getElementById("scale").value;updateMesh();});
document.getElementById("detail").addEventListener("input", (event) => {detail = document.getElementById("detail").value;updateMesh();});
document.getElementById("octave").addEventListener("input", (event) => {octave = document.getElementById("octave").value;updateMesh();});
document.getElementById("water_level").addEventListener("input", (event) => {water_level = document.getElementById("water_level").value;updateMesh();});
document.getElementById("render_mode").addEventListener("input", (event) => {render_mode = document.getElementById("render_mode").value;updateMesh();});

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
