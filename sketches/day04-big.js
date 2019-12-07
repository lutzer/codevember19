const canvasSketch = require('canvas-sketch')
const  { lerp } = require('canvas-sketch-util/math')
const random  = require('canvas-sketch-util/random');
const _ = require('lodash')
const palettes = require('nice-color-palettes');

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  fps: 24
}

const MULT_ROT = 10

const sketch = () => {
  const margin = - 20
  
  // generate random values
  const colors = random.shuffle(random.pick(palettes));

  const triangleSize = random.range(0.01,0.02)
  const multSpeed = random.range(500,1000)
  const numberOfTriangles = random.rangeFloor(300,1000)

  const createTriangles = (number) => Array(number).fill(0).map( (val, index) => {
    let x = Math.random()
    let y = Math.random()
    return { 
      x: x,
      y: y,
      l1: random.noise3D(0, index, 0) * triangleSize,
      l2: random.noise3D(0.1, index, 0) * triangleSize,
      rotation: Math.random() * Math.PI * 2,
      rotVelocity: (Math.random() -0.5) * MULT_ROT,
      velocity: [(x - 0.5) * random.range(0.1,1) * multSpeed, (y - 0.5) * random.range(0.1,1) * multSpeed],
      color: random.pick(colors)
    }
  }) 

  const triangles = createTriangles(numberOfTriangles)
  // console.log(triangles)
  let lastFrameTime = 0


  return ({ context, width, height, time, frame }) => {
    let deltaT = (time - lastFrameTime) / 1000;
    lastFrameTime = time

    context.globalCompositeOperation = "normal"
      
    context.fillStyle = 'black'
    context.globalAlpha = frame == 0 ? 1 : 0.1
    context.fillRect(0, 0, width, height)

    //update triangles
    triangles.forEach( (triangle, index) => {

      // move triangle
      triangle.x = triangle.x + triangle.velocity[0] * deltaT
      triangle.y = triangle.y + triangle.velocity[1] * deltaT

      // deflect on circle
      let toCenter = [ 0.5 - triangle.x, 0.5 - triangle.y]
      let dist = Math.sqrt(toCenter[0] * toCenter[0] + toCenter[1] * toCenter[1])
      
      if (dist > 0.7) {
        triangle.x = 0.5
        triangle.y = 0.5
      }

      // change shape
      triangle.l1 = random.noise3D(0, index, time * 0.1) * triangleSize * 1/Math.max(0.2,dist)
      triangle.l2 = random.noise3D(0.1, index, time * 0.1) * triangleSize * 1/Math.max(0.2,dist)

      // rotate
      let mass = triangle.l1 * triangle.l2 / 2;
      triangle.rotation += triangle.rotVelocity * deltaT / Math.max(0.01,mass)

      
    })

    // draw triangles
    triangles.forEach( ({x, y, l1, l2, rotation, color}, index) => {
      context.fillStyle = color
      context.globalAlpha = 0.6

      let p1 = [ x, y ]
      let p2 = [ x + Math.cos(rotation) * l1, y + Math.sin(rotation) * l1]
      let p3 = [ x - Math.sin(rotation) * l2, y + Math.cos(rotation) * l2]

      context.beginPath()
      context.moveTo(p1[0]* width, p1[1] * height)
      context.lineTo(p2[0]* width, p2[1] * height)
      context.lineTo(p3[0]* width, p3[1] * height)
      context.lineTo(p1[0]* width, p1[1] * height)
      context.closePath()
      context.fill()
    })
  };
};

canvasSketch(sketch, settings);
