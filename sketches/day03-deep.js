global.THREE = require("three");

const canvasSketch = require('canvas-sketch');
const glslify = require('glslify');

require('three/examples/js/postprocessing/EffectComposer.js');
require('three/examples/js/postprocessing/ShaderPass.js');
require('three/examples/js/shaders/CopyShader.js');
require('three/examples/js/postprocessing/RenderPass.js');
require('three/examples/js/postprocessing/UnrealBloomPass.js');
require('three/examples/js/shaders/LuminosityHighPassShader.js');

const PIXEL_BUFFER_SIZE = 6;

// Setup our sketch
const settings = {
  dimensions: [ 512, 512 ],
  context: 'webgl',
  animate: true
};

const bgShader = {
  uniforms: {
    // Expose props from canvas-sketch
    time: { value: 1.0 },
    bg_gradient_top: { value: rgbToVec3(34, 82, 130) },
    bg_gradient_bottom: { value: rgbToVec3(0, 0, 0) },
    light_angle: { value: 30 / 360 * Math.PI },
    nFreq: { value: 4.0 }
  },
  fragmentShader: glslify( /*glsl*/ `
    precision highp float;

    uniform float time;
    uniform vec3 bg_gradient_top;
    uniform vec3 bg_gradient_bottom;
    uniform float light_angle;
    uniform float nFreq;
    varying vec2 vUv;

    #pragma glslify: noise = require('glsl-noise/simplex/3d');
    #pragma glslify: worley3D = require(glsl-worley/worley3D.glsl)

    void main () {
      vec3 bg = mix(bg_gradient_top, bg_gradient_bottom, 1.0-vUv.y);

      vec2 rot = vec2(cos(light_angle) * vUv.x - sin(light_angle) * vUv.y, 
                      sin(light_angle) * vUv.x + cos(light_angle) * vUv.y);

      float light = noise(vec3(rot.x * nFreq, time * 0.2, 0.0));

      light *= rot.y * rot.y * rot.y * 0.2;

      vec3 color = mix(bg, vec3(1.0,1.0,1.0), light);

      // add floating dots
      vec2 T = worley3D(vec3(vUv.x * 5.0, vUv.y * 5.0 - time * 0.2,1.0), 1.0, false);
      float x = (T.x < 0.085) ? T.x * 8.0 : 0.0;
      color = mix(color, vec3(1.0), x * 0.2);


      gl_FragColor = vec4(color, 1.0);
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

const fgShader = {
  uniforms: {
    tDiffuse: { value: null },
    light_angle: { value: 30 / 360 * Math.PI },
    nFreq: { value: 3.0 },
    time: { value: 1.0 }

  },
  vertexShader: glslify(/* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }
  `),
  fragmentShader: glslify(/* glsl */`
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float light_angle;
    uniform float nFreq;

    varying vec2 vUv;

    #pragma glslify: noise = require('glsl-noise/simplex/3d');
    #pragma glslify: worley3D = require(glsl-worley/worley3D.glsl)

    void main() {
      vec4 prevColor = texture2D(tDiffuse, vUv);

      // add light
      vec2 rot = vec2(cos(light_angle) * vUv.x - sin(light_angle) * vUv.y, 
                    sin(light_angle) * vUv.x + cos(light_angle) * vUv.y);
      float light = noise(vec3(rot.x * nFreq, time * 0.2, 0.0));
      light *= rot.y * rot.y * rot.y * 0.4;
      vec3 color = mix(prevColor.rgb, vec3(1.0,1.0,1.0), light);

      // add floating dots
      vec2 T = worley3D(vec3(vUv.x * 5.0, vUv.y * 5.0 - time * 0.5,0.0), 1.0, false);
      float x = (T.x < 0.088) ? T.x * 8.0 : 0.0;
      color = mix(color, vec3(1.0), x * 0.2);


      vec2 F = worley3D(vec3(vUv.xy * 90.0, time / 1.0), 1.0, false);
      color = mix(color, vec3(1.0), F.x * 0.05);

      

      gl_FragColor = vec4(color, 1.0);

      
      // gl_FragColor = vec4(vec3(x), 1.0);
    }
  `),
};

const meshShader = {
  uniforms: {
    time: { value: 1.0},
    radius: { value: 0.1 },
    brightness: { value : 1.0}
  },
  fragmentShader: glslify(/* glsl */`
    #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');
    #pragma glslify: noise = require('glsl-noise/simplex/3d);
    uniform float time;
    uniform float brightness;
    varying float n;
    varying vec2 vUv;
    void main () {
      float hue = n * 0.3;
      hue = mod(hue + time * 0.05, 1.0);

      float dot = noise(vec3(vUv.x * 120., vUv.y * 40., time * 1.));

      float v = (dot > 0.5) ? (dot - 0.5) + 0.3 : 0.4;
      vec3 color = hsl2rgb(hue, 0.4, v * brightness);
      gl_FragColor = vec4(color, 1.0);
    }
  `),
  vertexShader: glslify(/* glsl */`
    #pragma glslify: noise = require('glsl-noise/simplex/4d);
    uniform float time;
    uniform float radius;
    varying float n;
    varying vec2 vUv;
    void main () {
      vUv = uv;
      n = noise(vec4(position.xyz * 4., time / 15.));
      vec3 transformed = position.xyz + normal * n * radius;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    }
  `)
}

function rgbToVec3(r,g,b) { return [ r / 255, g / 255, b / 255 ] };

function setShaderUniforms(material, uniforms) {
  Object.keys(uniforms).forEach( (key) => {
    material.uniforms[key].value = uniforms[key]
  });
}

function rgbToLumincance(r,g,b) {
  return (0.299*r + 0.587*g + 0.114*b) / 255
}

function getBrightnessFromBuffer(pixelBuffer) {
  let brightness = 0
  for(let i=0; i < pixelBuffer.length - 3; i += 4) {
    brightness += rgbToLumincance(pixelBuffer[i],pixelBuffer[i+1], pixelBuffer[i+2]);
  }
  return brightness / pixelBuffer.length * 4
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

  //light scene
  const lightScene = new THREE.Scene();

  // add background plane
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1),
    new THREE.ShaderMaterial(bgShader)
  );
  const lightBackground = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1),
    new THREE.ShaderMaterial(bgShader)
  );
  lightScene.add(lightBackground);
  scene.add(background);

  // add particles
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.13,64,64),
    new THREE.ShaderMaterial(meshShader)
  );
  mesh.position.set(0,0,0.2)
  scene.add(mesh)

  const renderScene = new THREE.RenderPass( scene, camera );

  var texture = new THREE.WebGLRenderTarget(width, height);
  var pixelBuffer = new Uint8Array( 4 * PIXEL_BUFFER_SIZE * PIXEL_BUFFER_SIZE );

  const composer = new THREE.EffectComposer( renderer, texture );
  const fgShaderPass = new THREE.ShaderPass( fgShader );
  composer.addPass( renderScene );
  composer.addPass( fgShaderPass );

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render ({time}) {
      setShaderUniforms(lightBackground.material, { time: time })
      

      // render scene to texture
      renderer.setRenderTarget(texture)
      renderer.render(lightScene, camera)

      // // figure out brightness of center
      renderer.readRenderTargetPixels(texture, width/2 - 3, height/2 - 3, PIXEL_BUFFER_SIZE, PIXEL_BUFFER_SIZE, pixelBuffer)
      let brightness = getBrightnessFromBuffer(pixelBuffer)

      setShaderUniforms(background.material, { time: time })
      setShaderUniforms(mesh.material, { time: time, radius: mesh.geometry.parameters.radius, brightness : (brightness - 0.1) * 10 + 0.2 })
      setShaderUniforms(fgShaderPass, { time: time })

      mesh.rotation.y = time / 5
      mesh.rotation.x = time / 7

      // render scene
      renderer.setRenderTarget( null )
      composer.render();


    },
    unload () {
      renderer.dispose();
    }
  }
};

canvasSketch(sketch, settings);