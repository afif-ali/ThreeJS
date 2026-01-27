import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


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

// Initialize renderer to canvas and add a scene
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#canvas"), antialias: true, context: canvas.getContext('webgl2') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( render );

const scene = new THREE.Scene();
scene.background = 0x000000;

// Create camera and add orbit controls
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 15, 15);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.maxDistance = 100;
controls.minDistance = 15;
controls.update();


// Add objects to scene
const ambientLight = new THREE.AmbientLight( 0x404040 );
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( document.getElementById("sun_color").value, document.getElementById("sun_intensity").value);
scene.add( directionalLight );

document.getElementById("sun_color").addEventListener("input", (event) => {directionalLight.color.set(event.target.value);});
document.getElementById("sun_intensity").addEventListener("input", (event) => {directionalLight.intensity = event.target.value;});

const terrain = new THREE.Mesh();
scene.add(terrain);
const water = new THREE.Mesh();
scene.add(water);

terrain.geometry = new THREE.IcosahedronGeometry(10, Math.round(document.getElementById("detail").value));
water.geometry = new THREE.IcosahedronGeometry(10, Math.round(document.getElementById("detail").value));
document.getElementById("detail").addEventListener("input", (event) => {
  terrain.geometry = new THREE.IcosahedronGeometry(10, Math.round(event.target.value));
  terrain.geometry.needsUpdate=true;
  water.geometry = new THREE.IcosahedronGeometry(10, Math.round(event.target.value));
  water.geometry.needsUpdate=true;
});

let watershader = null;
function updateShaders(render_mode) {
  if (render_mode == "lit") {
    terrain.material = new THREE.MeshPhongMaterial({flatShading:true});
    water.material = new THREE.MeshPhongMaterial({flatShading:true});
  } else if (render_mode == "normal") {
    terrain.material = new THREE.MeshNormalMaterial({flatShading:true});
    water.material = new THREE.MeshNormalMaterial({flatShading:true});
  } else if (render_mode == "flat") {
    terrain.material = new THREE.MeshToonMaterial({wireframe:false});
    water.material = new THREE.MeshToonMaterial({wireframe:false});
  } else if (render_mode == "wireframe") {
    terrain.material = new THREE.MeshBasicMaterial({wireframe:true});
    water.material = new THREE.MeshBasicMaterial({wireframe:true});
  }

function getInputColorVec3(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new THREE.Vector3(r, g, b);
}

  terrain.material.onBeforeCompile = (shader) => {
    shader.uniforms.uScale = { value: document.getElementById("scale").value };
    shader.uniforms.uHeight = { value: document.getElementById("height").value };
    shader.uniforms.uOctaves = { value: document.getElementById("octaves").value };
    shader.uniforms.uLandColor = { value: getInputColorVec3(document.getElementById("land_color").value) };

    document.getElementById("height").addEventListener("input", (event) => {shader.uniforms.uHeight.value = document.getElementById("height").value;});
    document.getElementById("scale").addEventListener("input", (event) => {shader.uniforms.uScale.value = document.getElementById("scale").value;});
    document.getElementById("octaves").addEventListener("input", (event) => {shader.uniforms.uOctaves.value = document.getElementById("octaves").value;});
    document.getElementById("land_color").addEventListener("input", (event) => {shader.uniforms.uLandColor.value = getInputColorVec3(document.getElementById("land_color").value);});
    
    shader.vertexShader = `
    uniform sampler3D uNoiseTex;
    uniform float uHeight;
    uniform float uScale;
    uniform float uOctaves;
    ` + shader.vertexShader;
    shader.vertexShader = noiseshadersource + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      `
      vec3 f(vec3 position) {
        vec3 result = position;
        for (float j=1.0; j<=uOctaves; j+=1.0)
        {
          result += normal * cnoise(position * uScale * j) * uHeight/(j*j);
        }
        return result;
      }

      void main() {
      `
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      transformed = f(position);

      `
    );
    shader.fragmentShader =
    `
    uniform vec3 uLandColor;
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      'diffuseColor = vec4( diffuse, opacity );',
      `
      diffuseColor = vec4( diffuse * uLandColor , opacity);
      `
    )
  };

  water.material.onBeforeCompile = (shader) => {
    watershader = shader;

    shader.uniforms.uWaterLevel = { value: document.getElementById("water_level").value };
    shader.uniforms.uAmplitude = { value: document.getElementById("amplitude").value };
    shader.uniforms.uFrequency = { value: document.getElementById("frequency").value };
    shader.uniforms.uSpeed = { value: document.getElementById("speed").value };
    shader.uniforms.uTime = { value: 0.0 };
    shader.uniforms.uWaterColor = { value: getInputColorVec3(document.getElementById("water_color").value) };
    
    document.getElementById("water_level").addEventListener("input", (event) => {shader.uniforms.uWaterLevel.value = document.getElementById("water_level").value;});
    document.getElementById("amplitude").addEventListener("input", (event) => {shader.uniforms.uAmplitude.value = document.getElementById("amplitude").value; });
    document.getElementById("frequency").addEventListener("input", (event) => {shader.uniforms.uFrequency.value = document.getElementById("frequency").value; });
    document.getElementById("speed").addEventListener("input", (event) => {shader.uniforms.uSpeed.value = document.getElementById("speed").value; });
    document.getElementById("water_color").addEventListener("input", (event) => {shader.uniforms.uWaterColor.value = getInputColorVec3(document.getElementById("water_color").value);});
    
    shader.vertexShader = `
    uniform float uWaterLevel;
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;
    uniform float uTime;
    ` + shader.vertexShader;
    shader.vertexShader = noiseshadersource + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float noise_displace_1 = uAmplitude * cnoise(position * uFrequency + vec3(1.0) * uSpeed * uTime);
      float noise_displace_2 = uAmplitude * cnoise(position * uFrequency * 0.5 - vec3(1.0) * uSpeed * uTime);
      transformed = position + normal * (uWaterLevel + noise_displace_1 + noise_displace_2);
      `
    );
    shader.fragmentShader =
    `
    uniform vec3 uWaterColor;
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      'diffuseColor = vec4( diffuse, opacity );',
      `
      diffuseColor = vec4( diffuse * uWaterColor , opacity);
      `
    )
  }
}

updateShaders(document.getElementById("render_mode").value);
document.getElementById("render_mode").addEventListener("input", (event) => {
  updateShaders(document.getElementById("render_mode").value);
});

// Render scene
const clock = new THREE.Clock();
function render() {
  if (watershader !== null)
  {
    watershader.uniforms.uTime.value = clock.getElapsedTime();
  }

  renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);