const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  dimensions: [ 512, 512 ],
  context: 'webgl',
  animate: true
};

// Your glsl code
const frag = glsl(`
  precision highp float;

  uniform float time;
  uniform vec3 bg_gradient_top;
  uniform vec3 bg_gradient_bottom;
  uniform float light_angle;
  varying vec2 vUv;

  #pragma glslify: noise = require('glsl-noise/simplex/3d');

  void main () {
    vec3 bg = mix(bg_gradient_top, bg_gradient_bottom, 1.0-vUv.y);

    vec2 rot = vec2(cos(light_angle) * vUv.x - sin(light_angle) * vUv.y, 
                        sin(light_angle) * vUv.x + cos(light_angle) * vUv.y);

    float pos = (vUv.x - vUv.y) * 0.5;

    float light = noise(vec3(rot.x * 5.0, time * 0.2, 0.0));
    float intensity = noise(vec3(rot.x * 5.0, time * 0.2, 1.0));

    light *= vUv.y * vUv.y * 0.3;

    vec3 color = mix(bg, vec3(1.0,1.0,1.0), light);
    gl_FragColor = vec4(color, 1.0);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {

	function rgbToVec3(r,g,b) { return [ r / 255, g / 255, b / 255 ] };

  const shader = createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      bg_gradient_top: () => rgbToVec3(34, 82, 130),
      bg_gradient_bottom: () => rgbToVec3(23, 55, 87),
      light_angle: () => 30 / 360 * Math.PI
    }
  });

  return {
    render ({context, width, height, time}) {
      // Render shader
      shader.render({ time: time });

      // console.log(context)

      // context.font = '20pt Calibri';
      // context.fillStyle = 'green';
      // context.fillText('Welcome to Tutorialspoint', 70, 70);

      // canvas.beginPath()
      // canvas.moveTo(0, 0)
      // canvas.lineTo(width, height)
      // canvas.lineTo(0, height)
      // canvas.closePath()
      // canvas.fill()
    },
    unload () {
      // Cleanup shader and mouse event
      shader.unload();
    }
  }
};

canvasSketch(sketch, settings);