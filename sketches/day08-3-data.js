/*
 * Visualisation of Corona cases 
 * Data from https://data.humdata.org/dataset/novel-coronavirus-2019-ncov-cases
 */

// Ensure ThreeJS is in global scope
global.THREE = require("three");

// Include any additional ThreeJS examples below
require('three/examples/js/geometries/ConvexGeometry.js');
require('three/examples/js/math/ConvexHull.js');

const canvasSketch = require("canvas-sketch");
const load = require('load-asset');
const parseCsv = require('csv-parse/lib/sync')
const _ = require('lodash')
const { lerpFrames, mapRange } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  context: "webgl",
  duration: 20
}

const params = {
  cameraDistance : 70,
  locationBins: 18, 
  dataUrl: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'
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
    rawdata = await load({ url: params.dataUrl, type: 'text' });
  } catch (err) {
    alert("Could not fetch data from " + params.dataUrl)
  }
  
  // parse data and put them into bins depending on geo location
  const data = parseCsv(rawdata, { from_line: 2 }).map( (line) => {
    let coords = [ Number(line[2]), Number(line[3])]
    let latBin = Math.floor(mapRange(coords[0],-90, 90, 0, params.locationBins))
    let lonBin =  Math.floor(mapRange(coords[1], 0, 360, 0, params.locationBins))
    return {
      name: line[1],
      coords: coords,
      values: line.slice(4).map(Number),
      bin: latBin * params.locationBins + lonBin
    }
  })

  console.log(data)

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

  const vertices = data.map( ({coords, values}, index) => {
    var [x,y,z] = polarToCartesian(coords[0], coords[1])
    return new THREE.Vector3(x,y,z)
  })
  const geometry = new THREE.ConvexBufferGeometry( vertices );


  const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial( {
    color: 0xffffff,
    opacity: 0.5,
    transparent: true
  }));
  scene.add(mesh);

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
      camera.lookAt(0,0,0)
      // create vertices frm data
      // const vertices = data.map( ({coords, values}, index) => { 
      //   let cases = lerpFrames(_.concat([0],values,[0]), easeInOutQuad(playhead))
      //   let casesLog = Math.log(1 + cases)
      //   let color = new THREE.Color()
      //   color.setHSL( mapRange(casesLog, 0, 7, 0.25, 0, true) , mapRange(casesLog, 0, 3, 0, 1.0, true), 0.5);
      //   return {
      //     position: _.concat([0,0,0], polarToCartesian(coords[0], coords[1], 3 + casesLog)),
      //     color: [ 0,0,0, color.r,color.g,color.b ] 
      //   }
      // })

      // geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( _.flatMap(vertices, (ele) => ele.position)), 3 ) );
      // geometry.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( _.flatMap(vertices, (ele) => ele.color)), 3 ) );

      // renderer.render(scene, camera);
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
