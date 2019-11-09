// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

const canvasSketch = require("canvas-sketch");
const palettes = require('nice-color-palettes');
const random = require('canvas-sketch-util/random');

const settings = {
  suffix: random.getSeed(),
  dimensions: [ 512, 512 ],
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
};

const createGrid = (size) => {

}

const sketch = ({ context }) => {

  context.canvas.style.background = "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(30,30,30,1) 100%)"

  console.log(context.canvas.style)

  const colors = random.shuffle(random.pick(palettes));
  const frequency = 1.5;

  const createGrid = (size) => {
    const points = [];

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          let u = x / (size - 1);
          let v = y / (size - 1);
          let w = z / (size - 1);

          const noise = random.noise3D(u * frequency, v * frequency, w * frequency);

          points.push({
            color: random.pick(colors),
            scale: noise * 0.08,
            position: [u, v, w]
          });
        }
      }
    }
    return points;
  }

  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("#444", 0);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  camera.position.set(0, 0, -1.2);
  camera.lookAt(new THREE.Vector3());

  // Setup your scene
  const scene = new THREE.Scene();

  const createBox = (x,y,z, color = 0x777777) => {
    // Setup a geometry
    const geometry = new THREE.BoxBufferGeometry(1,1,1)

    // Setup a material
    const material = new THREE.MeshPhongMaterial({ 
      color: color, 
      specular: 0xffffff,
      shininess: 30, 
      flatShading: true
    });

    // Setup a mesh with geometry + material
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x - 0.5,y - 0.5,z - 0.5)
    return mesh
  }

  const points = createGrid(10);

  const meshes = new THREE.Group()
  points.forEach( (point) => {
    if (point.scale > 0) {
      let box = createBox(point.position[0], point.position[1], point.position[2], /*point.color*/)
      box.scale.set(point.scale, point.scale, point.scale)
      meshes.add(box)
    }
  })
  let box = createBox(0,0,0)
  // meshes.add(box)

  console.log(meshes)
  
  scene.add(new THREE.AmbientLight( 0x333333 ));
  var light = new THREE.DirectionalLight( 0xffffff, 0.125 );
  light.position.set( 0, 0, -10 );
  scene.add(light)
  scene.add(meshes);

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
    render({ time }) {
      renderer.render(scene, camera);
      meshes.rotateX(0.001)
      meshes.rotateY(0.002)
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
