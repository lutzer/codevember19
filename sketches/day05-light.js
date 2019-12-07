global.THREE = require("three");

const canvasSketch = require('canvas-sketch');
const glslify = require('glslify');
const _ = require("lodash");

require('three/examples/js/controls/OrbitControls.js')
require('three/examples/js/postprocessing/EffectComposer.js');
require('three/examples/js/postprocessing/ShaderPass.js');
// require('three/examples/js/shaders/CopyShader.js');
require('three/examples/js/postprocessing/RenderPass.js');
// require('three/examples/js/postprocessing/UnrealBloomPass.js');
// require('three/examples/js/shaders/LuminosityHighPassShader.js');

const PIXEL_BUFFER_SIZE = 6;

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
    grid: { value : 10.0 },
    nFreq: { value: 4.0 },
    seed : { value : 0.0 },
    hue: { value: 0.0 }
  },
  fragmentShader: glslify( /*glsl*/ `
    precision highp float;

    uniform float time;
    uniform float nFreq;
    uniform float grid;
    uniform float seed;
    uniform float hue;
    varying vec2 vUv;

    #pragma glslify: noise = require('glsl-noise/simplex/3d');
    #pragma glslify: hsv2rgb = require(glsl-y-hsv/hsv2rgb) 

    void main () {
      vec2 grid = floor(vUv.xy * grid) / grid;
      float n = noise(vec3(grid.x * 2., grid.y * 0.8 - time * 1.5, time * 1.0 + seed));

      float prob = log(grid.y) / log(15.0);

      float brightness = (prob * n) > 0.1 ? min(0.5, prob * n) : 0.0;

      vec3 hsv = vec3(hue + brightness * 0.3, 1.0, brightness);

      vec3 color = hsv2rgb(hsv);
      // vec3 color = vec3(seed / 10.0);
      gl_FragColor = vec4(color, brightness) + 0.1;
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

// Your sketch, which simply returns the shader
const sketch = ({ context, width, height }) => {

  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("#000", 1.0);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
  camera.position.set(0, 0, 2);
  camera.lookAt(new THREE.Vector3());
  const cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.autoRotate = false
  cameraControls.autoRotateSpeed = 5.0

  // Setup your scene
  const scene = new THREE.Scene();

  // add flames
  const flames = _.range(-0.4, 0.4, 0.1).map( (val, index) => {
    const flame = new THREE.Mesh(
      new THREE.PlaneGeometry(1,1),
      new THREE.ShaderMaterial(_.cloneDeep(flameShader))
    );
    flame.material.transparent = true
    flame.material.side = THREE.DoubleSide
    flame.position.setZ(val)
    setShaderUniforms(flame.material, { seed: index  })
    scene.add(flame);
    return flame
  })

  const renderScene = new THREE.RenderPass( scene, camera );

  const composer = new THREE.EffectComposer( renderer );
  composer.addPass( renderScene );

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render ({time}) {
      cameraControls.update();

      flames.forEach( (flame, index) => {
        setShaderUniforms(flame.material, { time: time, hue : time/20.0 + index * 0.03 })
      })

      composer.render()

    },
    unload () {
      renderer.dispose();
    }
  }
};

canvasSketch(sketch, settings);