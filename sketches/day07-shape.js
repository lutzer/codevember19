const canvasSketch = require('canvas-sketch')
const  { lerp } = require('canvas-sketch-util/math')
const random  = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');
const interpolate = require('color-interpolate');
const _ = require('lodash')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  fps: 24
}

const params = {
  circleSize : settings.dimensions[0] / 3,
  numberOfLines: random.rangeFloor(50, 250),
  noiseFreq: random.range(2,6)
}


function wrappableNoise2D(x, y, octave = 1) {
  return random.noise3D(
    Math.sin(x/octave * Math.PI * 2), 
    Math.cos(x/octave * Math.PI * 2), 
    y
  )
}

function euclidianDistance(p1,p2) {
  let dx = p2[0]-p1[0]
  let dy = p2[1]-p1[1]
  return Math.sqrt(dx*dx+dy*dy)
}

const sketch = () => {
  const colors = _.sample(palettes);
  const colormap = interpolate(colors);

  const createVertices = (number, time) => Array(number).fill(0).map( (val, index) => {
    let length = lerp(0.2, 1.0, wrappableNoise2D(index / number * 5, time, 5) * 0.5 + 1.0)
    let angle = (index / number) * Math.PI * 2
    return {
       point: [Math.cos(angle) * length, Math.sin(angle) * length],
       length: length
    }
  })


  var pairs = []


  return ({ context, width, height, time, frame }) => {

    context.fillStyle = 'white'
    context.globalAlpha = 0.08
    context.fillRect(0, 0, width, height)

    const vertices = createVertices(params.numberOfLines, time / 8)

    

    // shuffle pairs
    pairs = _.zip(_.range(params.numberOfLines), _.shuffle(_.range(params.numberOfLines)))

    // draw Lines
    pairs.forEach( (pair) => {
      let v1 = vertices[pair[0]]
      let v2 = vertices[pair[1]]
      let p1 = [ width / 2 + v1.point[0] * params.circleSize, height/2 + v1.point[1] * params.circleSize]
      let p2 = [ width / 2 + v2.point[0] * params.circleSize, height/2 + v2.point[1] * params.circleSize]

      context.strokeStyle = 'black'
      context.globalAlpha = 0.1
      context.beginPath()
      context.moveTo(p1[0], p1[1])
      context.lineTo(p2[0], p2[1])
      context.closePath()
      context.stroke()
    })

    context.strokeStyle = 'black'
    context.globalAlpha = 0.2

    context.beginPath()
    vertices.forEach( ({point}, index) => {
      if (index == 0 )
        context.moveTo(width / 2 + point[0] * params.circleSize, height/2 + point[1] * params.circleSize)
      else
        context.lineTo(width / 2 + point[0] * params.circleSize, height/2 + point[1] * params.circleSize)
    })
    context.closePath()
    context.stroke()
  };
};

canvasSketch(sketch, settings);
