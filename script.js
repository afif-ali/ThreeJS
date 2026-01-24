import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

// Initialize renderer to canvas and add a scene
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#canvas"), antialias: true, context: canvas.getContext('webgl2') });
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
const grid = new THREE.GridHelper(100,100);
scene.add(grid);

const terrain = new THREE.Mesh();
scene.add(terrain);
const water = new THREE.Mesh();
scene.add(water);

let height = document.getElementById("height").value;
let scale = document.getElementById("scale").value;
let detail = document.getElementById("detail").value;
let octave = document.getElementById("octave").value;
let water_level = document.getElementById("water_level").value;
let render_mode = document.getElementById("render_mode").value;
let sun_color = document.getElementById("sun_color").value;
let sun_intensity = document.getElementById("sun_intensity").value;



const terrain_geometry = new THREE.IcosahedronGeometry(10, Math.round(detail));
const water_geometry = new THREE.IcosahedronGeometry(10, Math.round(detail));

const terrain_material = new THREE.MeshNormalMaterial();
const water_material = new THREE.MeshNormalMaterial();

terrain_material.onBeforeCompile = (shader) => {
  shader.uniforms.uScale = { value: document.getElementById("scale").value };
  shader.uniforms.uHeight = { value: document.getElementById("height").value };
  document.getElementById("height").addEventListener("input", (event) => {shader.uniforms.uHeight.value = document.getElementById("height").value;});
  document.getElementById("scale").addEventListener("input", (event) => {shader.uniforms.uScale.value = document.getElementById("scale").value;});
  //document.getElementById("detail").addEventListener("input", (event) => {detail = document.getElementById("detail").value;});
  //document.getElementById("octave").addEventListener("input", (event) => {octave = document.getElementById("octave").value;});
  //document.getElementById("water_level").addEventListener("input", (event) => {water_level = document.getElementById("water_level").value;});
  //document.getElementById("render_mode").addEventListener("input", (event) => {render_mode = document.getElementById("render_mode").value;});
  //document.getElementById("sun_color").addEventListener("input", (event) => {sun_color = document.getElementById("sun_color").value;});
  //document.getElementById("sun_intensity").addEventListener("input", (event) => {sun_intensity = document.getElementById("sun_intensity").value;});

  shader.vertexShader = `
    uniform sampler3D uNoiseTex;
    uniform float uHeight;
    uniform float uScale;
    ` + shader.vertexShader;
  shader.vertexShader = noiseshadersource + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    transformed = position + normal * cnoise(position * uScale) * uHeight;
    `
  );
};

terrain.geometry = terrain_geometry;
terrain.material = terrain_material;


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
        pos.getZ(i)*scale*j);
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
}

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



const noiseshadersource = `
vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));

  float n000 = norm0.x * dot(g000, Pf0);
  float n010 = norm0.y * dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n100 = norm0.z * dot(g100, vec3(Pf1.x, Pf0.yz));
  float n110 = norm0.w * dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = norm1.x * dot(g001, vec3(Pf0.xy, Pf1.z));
  float n011 = norm1.y * dot(g011, vec3(Pf0.x, Pf1.yz));
  float n101 = norm1.z * dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n111 = norm1.w * dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
`;