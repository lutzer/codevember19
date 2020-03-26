// Ensure ThreeJS is in global scope
global.THREE = require("three");

const canvasSketch = require("canvas-sketch");
const load = require('load-asset');
const parseCsv = require('csv-parse/lib/sync')
const _ = require('lodash')
const { lerpFrames } = require('canvas-sketch-util/math');
const { setCaption, setTitle } = require('./utils')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  context: "webgl",
  duration: 20
}

const params = {
  timeout: 1000,
  cameraDistance : 5.5,
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

const sketch = async ({ context, frame }) => {

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

  renderer.setClearColor("#fff", 1);

  // Setup your scene
  const scene = new THREE.Scene();  

  // Setup point geometries
  const geometry = new THREE.BufferGeometry();

  const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.9
  }));
  scene.add(lines);

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
        return _.concat([0,0,0], polarToCartesian(coords[0], coords[1], Math.log(1+cases)/Math.log(1+maxCases)))
      })
      geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(_.flatten(vertices)), 3 ) );

      var day = Math.floor(t*totalDays)
      setCaption(`Day ${day}`, settings.dimensions)

      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);