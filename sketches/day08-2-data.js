// Ensure ThreeJS is in global scope
global.THREE = require("three");

// Include any additional ThreeJS examples below
require('three/examples/js/postprocessing/EffectComposer.js');
require('three/examples/js/postprocessing/ShaderPass.js');
require('three/examples/js/shaders/CopyShader.js');
require('three/examples/js/postprocessing/RenderPass.js');
require('three/examples/js/postprocessing/UnrealBloomPass.js');
require('three/examples/js/shaders/LuminosityHighPassShader.js');
require('three/examples/js/shaders/HorizontalBlurShader.js');
require('three/examples/js/shaders/VerticalBlurShader.js');


const canvasSketch = require("canvas-sketch");
const load = require('load-asset');
const parseCsv = require('csv-parse/lib/sync')
const _ = require('lodash')
const { lerpFrames, mapRange } = require('canvas-sketch-util/math');
const { setCaption, setTitle, wait } = require('./utils')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  context: "webgl",
  duration: 20
}

const params = {
  timeout: 1000,
  cameraDistance : 6,
  dataUrl: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
  localDataUrl: 'assets/day08/time_series_covid19_confirmed_global.csv'
}

function polarToCartesian(latitude, longitude, radius = 1) {
  const x = 2*radius * Math.cos(latitude) * Math.cos(longitude)
  const y = 2*radius * Math.cos(latitude) * Math.sin(longitude)
  const z = 2*radius * Math.sin(latitude)
  return [ x, y, z]
}

function easeInOutQuad(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t }

const sketch = async ({ context, height, width }) => {

  // load data
  var rawdata = ""
  try {
    rawdata = await Promise.race([ 
      load({ url: params.dataUrl, type: 'text' }),
      wait(params.timeout).then( () => {throw "timeout"})
    ]);
  } catch (err) {
    rawdata = await load({ url: params.localDataUrl, type: 'text' });
  }
  
  // parse data
  const data = parseCsv(rawdata, { from_line: 2 }).map( (line) => {
    return {
      name: line[1],
      coords: [ Number(line[2]), Number(line[3])],
      values: line.slice(4).map(Number)
    }
  })

  //calculate maximum cases of sets
  const maxCases = data.reduce( (acc, curr) => {
    return Math.max(acc, _.max(curr.values))
  }, 0)

  const totalDays = data[0].values.length

  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, params.cameraDistance);

  renderer.setClearColor("#111", 1);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup point geometries
  const geometry = new THREE.BufferGeometry();

  const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    // color: 0x000000,
    transparent: true,
    opacity: 0.5,
    vertexColors: true
  }));
  scene.add(lines);

  //setup render passes
  var effectHBlur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
  var effectVBlur = new THREE.ShaderPass( THREE.VerticalBlurShader );
  effectHBlur.uniforms[ 'h' ].value = 2 / ( width / 0.05 );
  effectVBlur.uniforms[ 'v' ].value = 2 / ( height / 0.05 );

  var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold =  0.01;
  bloomPass.strength = 1.0;
  bloomPass.radius = 0;

  const composer = new THREE.EffectComposer( renderer );
  composer.addPass( new THREE.RenderPass( scene, camera ) );
  composer.addPass( effectHBlur );
  composer.addPass( effectVBlur );
  composer.addPass( bloomPass );

  setTitle(`Cases starting from 22nd of January`, settings.dimensions)

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ playhead }) {
      let t = easeInOutQuad(playhead)

      // rotate camera
      camera.position.set(Math.sin(playhead*Math.PI*2) * params.cameraDistance, 0, Math.cos(playhead*Math.PI*2) * params.cameraDistance);
      camera.lookAt(0,0,0)

      // create vertices frm data
      const vertices = data.map( ({coords, values}, index) => { 
        let cases = lerpFrames(_.concat([0],values,[0]), t)
        let casesLog = Math.log(1 + cases) / Math.log(1 + maxCases)
        let color = new THREE.Color()
        color.setHSL( mapRange(casesLog, 0, 0.75, 0.25, 0, true) , mapRange(casesLog, 0, 0.5, 0, 1.0, true), 0.5);
        return {
          position: _.concat([0,0,0], polarToCartesian(coords[0], coords[1], 0.25 + casesLog)),
          color: [ 0,0,0, color.r,color.g,color.b ] 
        }
      })

      var day = Math.floor(t*totalDays)
      setCaption(`Day ${day}`, settings.dimensions)

      geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( _.flatMap(vertices, (ele) => ele.position)), 3 ) );
      geometry.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( _.flatMap(vertices, (ele) => ele.color)), 3 ) );

      // renderer.render(scene, camera);
      composer.render();
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
