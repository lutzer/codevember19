/*
 * Visualisation of Corona cases 
 * Data from https://data.humdata.org/dataset/novel-coronavirus-2019-ncov-cases
 */

 console.log(process)

// Ensure ThreeJS is in global scope
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const load = require('load-asset');
const parseCsv = require('csv-parse/lib/sync')
const _ = require('lodash')
const { lerpFrames } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  context: "webgl",
  duration: 20
}

const params = {
  cameraDistance : 50
}

function polarToCartesian(latitude, longitude, radius = 1) {
  const x = 2*radius * Math.cos(latitude) * Math.cos(longitude)
  const y = 2*radius * Math.cos(latitude) * Math.sin(longitude)
  const z = 2*radius * Math.sin(latitude)
  return [ x, y, z]
}

const sketch = async ({ context, frame }) => {

  // load data
  const rawdata = await load({ url: 'https://data.humdata.org/hxlproxy/api/data-preview.csv?url=https%3A%2F%2Fraw.githubusercontent.com%2FCSSEGISandData%2FCOVID-19%2Fmaster%2Fcsse_covid_19_data%2Fcsse_covid_19_time_series%2Ftime_series_19-covid-Confirmed.csv&filename=time_series_2019-ncov-Confirmed.csv', type: 'text' });
  //const rawdata = await load({ url: __dirname + '/assets/day08/time_series_2019-ncov-Confirmed.csv', type: 'text' });
  
  // parse data
  const data = parseCsv(rawdata, { from_line: 2 }).map( (line) => {
    return {
      name: line[1],
      coords: [ Number(line[2]), Number(line[3])],
      values: _.concat( [0,0,0,0,0], line.slice(4).map(Number), [0])
    }
  })

  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, params.cameraDistance);

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  renderer.setClearColor("#fff", 1);

  // Setup your scene
  const scene = new THREE.Scene();

  // create vertices from data
  

  // Setup point geometries
  const geometry = new THREE.BufferGeometry();

  const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color: 0x000000
  }));
  scene.add(lines);

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
      // rotate camera
      camera.position.set(Math.sin(playhead*Math.PI*2) * params.cameraDistance, 0, Math.cos(playhead*Math.PI*2) * params.cameraDistance);

      // create vertices frm data
      const vertices = data.map( ({coords, values}, index) => { 
        let cases = lerpFrames(values, playhead)
        return _.concat([0,0,0], polarToCartesian(coords[0], coords[1], 1 + Math.log(1+cases)))
      })
      geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(_.flatten(vertices)), 3 ) );

      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
