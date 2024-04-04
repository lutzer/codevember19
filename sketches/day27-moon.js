const canvasSketch = require("canvas-sketch");
const palettes = require('nice-color-palettes');
const random = require('canvas-sketch-util/random');
const _ = require('lodash')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true
}

const params = {
  speed : 0.5,
  zoom : 0.4,
  amount: random.range(30, 150)
}

class Planet {
  constructor(options) {
    this.options = Object.assign({
      mass : 0.1, 
      distance : 0, 
      steps : 1,
      speed: 1,
      parent : null, 
      color : 'black',
      steps : 1
    }, options)

    
    // position in radians
    this.angle = random.range(0, Math.PI*2)
  }

  getPosition() {
    const { parent, distance } = this.options
    if (!parent)
      return [0, 0]
    
    const center = parent.getPosition()
    return [ center[0] + Math.cos(this.angle) * distance, center[1] + Math.sin(this.angle) * distance ]
    
  }

  update(dt) {
    const { distance, mass, speed } = this.options
    this.angle = (this.angle + dt * speed * 1/distance) % (Math.PI*2)
  }

  draw(context) {
    const { color, mass, steps } = this.options
    var pos = this.getPosition();

    // draw circle
    context.fillStyle = color
    context.beginPath()
    context.arc(pos[0],pos[1], mass, 0, 2*Math.PI/steps);
    context.closePath()
    context.fill()
    // context.stroke()
  }

  drawLine(context) {
    const { parent } = this.options
    if (!parent)
      return
    
    var pos = this.getPosition();
    var parentPos = parent.getPosition()

    context.beginPath()
    context.moveTo(pos[0], pos[1])
    context.lineTo(parentPos[0], parentPos[1]);
    context.closePath()
    context.stroke()

  }
}

const sketch = async ({ context, height, width }) => {

  const colors = random.shuffle(random.pick(palettes))

  const planets = []

  planets.push( new Planet({ mass: 0.05, color: random.pick(colors) }) )
  _.range(params.amount).forEach( () => {
    planets.push( new Planet({ mass: random.range(0.01,0.05), speed: random.range(-1,1), distance: random.range(0.2,1.0), parent: _.sample(planets), color: random.pick(colors) }) )
  })

  // draw each frame
  var lastTime = 0
  return ({ context, width, height, time }) => {
      const dt = time - lastTime
      lastTime = time

      context.globalAlpha = 0.05
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)

      context.strokeStyle = 'black'
      context.lineWidth = 10/width * params.zoom

      context.setTransform(params.zoom*width/2, 0, 0, params.zoom*height/2, +width/2, +height/2);
      planets.forEach((planet) => planet.update(dt * params.speed) )
      context.globalAlpha = 0.05
      planets.forEach((planet) => planet.drawLine(context))
      context.globalAlpha = 1.0
      planets.forEach((planet) => planet.draw(context))
 

  };
};

canvasSketch(sketch, settings);
