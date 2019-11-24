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

const MULT_SPEED = 1000
const MULT_ROT = 10
const TRIANGLE_SIZE = 0.2

const sketch = () => {
  const margin = - 20
  // const colors = palettes[3]
  const colors = random.shuffle(random.pick(palettes));

  const createTriangles = (number) => Array(number).fill(0).map( (val, index) => {
    return { 
      x: Math.random(),
      y: Math.random(),
      l1: random.noise3D(0, index, 0) * TRIANGLE_SIZE,
      l2: random.noise3D(0.1, index, 0) * TRIANGLE_SIZE,
      rotation: Math.random() * Math.PI * 2,
      rotVelocity: (Math.random() -0.5) * MULT_ROT,
      velocity: [(Math.random() - 0.5) * MULT_SPEED, (Math.random() - 0.5) * MULT_SPEED],
      color: random.pick(colors)
    }
  }) 

  const triangles = createTriangles(100)
  // console.log(triangles)
  let lastFrameTime = 0


  return ({ context, width, height, time }) => {
    let deltaT = (time - lastFrameTime) / 1000;
    lastFrameTime = time

    context.globalCompositeOperation = "normal"
      
    // context.fillStyle = 'white'
    // context.fillRect(0, 0, width, height)
    // context.globalCompositeOperation = "multiply"

    //update triangles
    triangles.forEach( (triangle, index) => {
      let mass = triangle.l1 * triangle.l2 / 2;

      triangle.l1 = random.noise3D(0, index, time * 0.1) * TRIANGLE_SIZE
      triangle.l2 = random.noise3D(0.1, index, time * 0.1) * TRIANGLE_SIZE

      // // calculate center attraction
      // let toCenter = [ 0.5 - triangle.x, 0.5 - triangle.y]
      // let dist = Math.sqrt(toCenter[0] * toCenter[0] + toCenter[1] * toCenter[1])
      // let force = 8000 * mass / (dist * dist) * deltaT
      //   - 6000 * mass / (dist * dist * dist ) * deltaT

      // let acc = [force * toCenter[0], force * toCenter[1]]

      // // add acceleration
      // triangle.velocity = [ triangle.velocity[0] + acc[0], triangle.velocity[1] + acc[1]]

      // // add friction
      // triangle.velocity = [triangle.velocity[0] * 1.0, triangle.velocity[1] * 1.0]

      triangle.x = triangle.x + triangle.velocity[0] * deltaT
      triangle.y = triangle.y + triangle.velocity[1] * deltaT

      // deflect
      if (triangle.x < 0) {
        triangle.x = 0
        triangle.velocity[0] *= -1
      } else if (triangle.x > 1) {
        triangle.x = 1
        triangle.velocity[0] *= -1
      }

      if (triangle.y < 0) {
        triangle.y = 0
        triangle.velocity[1] *= -1
      } else if (triangle.y > 1) {
        triangle.y = 1
        triangle.velocity[1] *= -1
      }


      // rotate
      triangle.rotation += triangle.rotVelocity * deltaT / Math.max(0.005,mass)

      
    })

    // draw triangles
    triangles.forEach( ({x, y, l1, l2, rotation, color}, index) => {
      context.fillStyle = color
      context.globalAlpha = 0.1

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
