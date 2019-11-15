global.THREE = require("three");

const canvasSketch = require('canvas-sketch');
const glslify = require('glslify');
const random = require('canvas-sketch-util/random');

// Setup our sketch
const settings = {
  dimensions: [ 512, 512 ],
  context: 'webgl',
  animate: true
};

// Your glsl code
const fragmentShader = glslify( /*glsl*/ `
  precision highp float;

  uniform float time;
  uniform vec3 bg_gradient_top;
  uniform vec3 bg_gradient_bottom;
  uniform float light_angle;
  uniform float nFreq;
  varying vec2 vUv;

  #pragma glslify: noise = require('glsl-noise/simplex/3d');

  void main () {
    vec3 bg = mix(bg_gradient_top, bg_gradient_bottom, 1.0-vUv.y);

    vec2 rot = vec2(cos(light_angle) * vUv.x - sin(light_angle) * vUv.y, 
                    sin(light_angle) * vUv.x + cos(light_angle) * vUv.y);

    float pos = (vUv.x - vUv.y) * 0.5;

    float light = noise(vec3(rot.x * nFreq, time * 0.2, 0.0));

    light *= rot.y * rot.y * rot.y * 0.2;

    vec3 color = mix(bg, vec3(1.0,1.0,1.0), light);
    gl_FragColor = vec4(color, 1.0);
  }
`);

const vertexShader = glslify(/* glsl */`
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
`);

function rgbToVec3(r,g,b) { return [ r / 255, g / 255, b / 255 ] };
function setShaderUniforms(material, uniforms) {
  Object.keys(uniforms).forEach( (key) => {
    material.uniforms[key].value = uniforms[key]
  });
}

function computeSphereNormals(vertices) {
  return vertices.map( (vertex) => {
    return vertex.clone().normalize()
  })
}

/**
 * @param {THREE.Mesh} object
 * @param {THREE.Vector3} center
 */
function morphCircle(vertices, normals, radius, shift, time) {
  let weight = radius * shift

  vertices.forEach( (vertex, index) => {
    let normal = normals[index]

    let offset = random.noise4D(normal.x, normal.y, 0, time / 10)

    vertex.x = normal.x * (radius + offset * weight);
    vertex.y = normal.y * (radius + offset * weight);
    vertex.z = normal.z * (radius + offset * weight);
  })
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
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, 1);
  camera.lookAt(new THREE.Vector3());

  // Setup your scene
  const scene = new THREE.Scene();

  // add background plane
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1),
    new THREE.ShaderMaterial({
      uniforms: {
            // Expose props from canvas-sketch
            time: { value: 1.0 },
            bg_gradient_top: { value: rgbToVec3(34, 82, 130) },
            bg_gradient_bottom: { value: rgbToVec3(18, 46, 74) },
            light_angle: { value: 30 / 360 * Math.PI },
            nFreq: { value: 4.0 }
      },
      fragmentShader: fragmentShader,
      vertexShader: vertexShader
    })
  );
  scene.add(background);

  // add particles
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.15,32,32),
    new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      transparent: true, 
      opacity: 0.15,
      roughness: 0.5,
      metalness: 0.4,
      wireframe: false
    })
  );
  const meshNormals = computeSphereNormals(mesh.geometry.vertices);
  mesh.position.set(0,0,0.2)
  scene.add(mesh)

  // setup light
  scene.add(new THREE.AmbientLight( 0x333 ));
  var light = new THREE.DirectionalLight( 0xffffff, 1.0 );
  light.position.set( 0.4, 1.0, 0.1 );
  scene.add(light)

  // var morphShift = 0.5
  // context.canvas.addEventListener("mousemove", (e) => {
  //   let u = e.layerX * 2/width - 1.0
  //   let v = e.layerY * 2/width - 1.0
  //   let dist = Math.min(Math.sqrt(u*u + v*v), 0.5)
  //   morphShift = dist
  // });

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render ({time}) {
      morphCircle(mesh.geometry.vertices, meshNormals, mesh.geometry.parameters.radius, 0.4, time)
      


      mesh.geometry.verticesNeedUpdate = true;
      // mesh.material.needsUpdate = true;
      setShaderUniforms(background.material, { time: time })
      //setShaderUniforms(particle.material, { time: time })
      // particle.position.set(time/5 % 1.0 - 0.5,0,0.2)
      renderer.render(scene, camera);

      let shiftX = random.noise2D(time / 10, 0.0) * 0.1;
      let shiftY = random.noise2D(time / 10, 1.0) * 0.1;
      mesh.position.setX(shiftX);
      mesh.position.setY(shiftY)

    },
    unload () {
      renderer.dispose();
    }
  }
};

canvasSketch(sketch, settings);