global.THREE = require("three");

const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const glslify = require('glslify');
const _ = require("lodash");

require('three/examples/js/controls/OrbitControls.js')
require('three/examples/js/postprocessing/EffectComposer.js');
require('three/examples/js/postprocessing/ShaderPass.js');
require('three/examples/js/shaders/CopyShader.js');
require('three/examples/js/postprocessing/RenderPass.js');
require('three/examples/js/postprocessing/UnrealBloomPass.js');
require('three/examples/js/shaders/LuminosityHighPassShader.js');

const PIXEL_BUFFER_SIZE = 6;
const CAMERA_RADIUS = 2.5;

// Setup our sketch
const settings = {
  dimensions: [ 512, 512 ],
  context: 'webgl',
  animate: true
};

const flameShader = {
  uniforms: {
    // Expose props from canvas-sketch
    time: { value: 1.0 },
    grid: { value : 16.0 },
    xFreq: { value: 1.8 },
    yFreq: { value: 1.0 },
    seed : { value : 0.0 },
    hue: { value: 0.0 }
  },
  fragmentShader: glslify( /*glsl*/ `
    precision highp float;

    uniform float time;
    uniform float grid;
    uniform float seed;
    uniform float hue;
    uniform float xFreq;
    uniform float yFreq;
    varying vec2 vUv;

    #pragma glslify: noise = require('glsl-noise/simplex/3d');
    #pragma glslify: hsv2rgb = require(glsl-y-hsv/hsv2rgb) 

    void main () {
      vec2 grid = floor(vUv.xy * grid) / grid;
      float n = noise(vec3(grid.x * xFreq, grid.y * yFreq - time * 1.0, time * 0.8 + seed));

      float prob = min(log(grid.y) / log(.05),1.0);

      float brightness = (prob * n) > 0.1 ? abs(prob * n) : 0.0;

      // vec3 hsv = vec3(hue + brightness * 0.1, 1.0, brightness);
      vec3 hsv = vec3(hue + brightness * 0.15, 1.0, 1.0);

      vec3 color = hsv2rgb(hsv);
      //vec3 color = vec3(prob);
      gl_FragColor = vec4(color, brightness);
    }
  `),
  vertexShader: glslify(/* glsl */`
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `)
}

function setShaderUniforms(material, uniforms) {
  Object.keys(uniforms).forEach( (key) => {
    material.uniforms[key].value = uniforms[key]
  });
}

function randomWalk(pos, speed, dt) {
  const walk = random.onCircle(speed * dt)
  const newPos = [ pos[0] + walk[0], pos[1] + walk[1] ]
  return newPos
}

// Your sketch, which simply returns the shader
const sketch = ({ context, width, height }) => {

  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("#000", 1.0);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);

  // Setup your scene
  const scene = new THREE.Scene();

  // add flames
  const flames = _.range(-0.7, 0.7, 0.01).map( (val, index) => {
    const flame = new THREE.Mesh(
      new THREE.PlaneGeometry(1,1),
      new THREE.ShaderMaterial(_.cloneDeep(flameShader))
    );
    flame.material.transparent = true
    flame.material.side = THREE.DoubleSide
    flame.position.setZ(val)
    flame.position.setY(0.25)
    setShaderUniforms(flame.material, { 
      seed: index
    })
    scene.add(flame);
    return flame
  })

      
  const renderScene = new THREE.RenderPass( scene, camera );

  const composer = new THREE.EffectComposer( renderer );
  composer.addPass(renderScene);

  // var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  // bloomPass.threshold =  0.4;
  // bloomPass.strength = 0.3;
  // bloomPass.radius = 10.0;

  // composer.addPass(bloomPass)

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render ({time}) {

      var angle = time * 0.1;

      camera.position.set(Math.sin(angle)*CAMERA_RADIUS, 1.2, Math.cos(angle)*CAMERA_RADIUS);
      camera.lookAt(new THREE.Vector3(0,0,0));

      flames.forEach( (flame, index) => {
        setShaderUniforms(flame.material, { time: time * 0.5, hue : time/30.0 + index * 0.015 })
      })

      composer.render()

    },
    unload () {
      renderer.dispose();
    }
  }
};

canvasSketch(sketch, settings);