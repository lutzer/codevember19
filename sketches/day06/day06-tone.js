const canvasSketch = require("canvas-sketch");
const palettes = require('nice-color-palettes');
const random = require('canvas-sketch-util/random');
const _ = require('lodash')
const Tone = require('tone')

const { sampler } = require('./sampler')
const { Planet, PlanetTypes } = require('./planet')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  seed: random.getRandomSeed(),
}

random.setSeed(settings.seed);

const scales = [
  [ 'C', 'E', 'A' ],
  [ 'C', 'D', 'F' ],
  [ 'C', 'E', 'G#' ],
  [ 'C', 'E#', 'G' ],
  [ 'C', 'E', 'G' ]
]

const params = {
  speed: 0.25, 
  zoom: 0.3,
  planets: random.rangeFloor(4, 10),
  notes: random.pick(scales),
  octaves: [ 2, 3, 5, 6 ] 
}


window.addEventListener('load', () => {
  Tone.Master.mute = true
  var caption = document.getElementById('caption')
  var button = document.createElement('button')
  button.innerHTML = "Sound off"
  button.addEventListener('click', () => {
    Tone.start()
    Tone.Master.mute = !Tone.Master.mute
    button.innerHTML = !Tone.Master.mute ? "Sound on" : "Sound off"
  })
  caption.appendChild(button)
})

const sketch = async ({ context, height, width }) => {

  // load sampler
  var piano = sampler

  function triggerHandler(planet) {
    if (piano.loaded)
      piano.triggerAttack(planet.note);
  }

  const colors = random.shuffle(random.pick(palettes))

  const planets = []

  planets.push( new Planet({ id: 'root', mass: 0.1, color: 'black' }) )
  _.range(params.planets).forEach( (i) => {
    var parent = random.pick(planets)
    var noteIndex = random.rangeFloor(params.notes.length)
    var octave = random.pick(params.octaves)
    planets.push( new Planet({ 
      id : i,
      mass: 0.05 + 1/octave * 0.15,
      distance: random.pick([4, 2, 1, 0.5, 0.25]), 
      parent: parent,
      color: colors[noteIndex % colors.length],
      note : params.notes[noteIndex] + octave,
      steps : random.pick([3, 4]),
      triggerCallback : triggerHandler
    }))
  })


  const maxRadius = _.max(planets.map( (planet) => {
    function getOrbitDistance(planet) {
      return planet.options.distance 
        + (planet.options.parent ? getOrbitDistance(planet.options.parent) : 0)
    }
    return getOrbitDistance(planet) 
  }))

  params.zoom = Math.min(0.5,0.8 / maxRadius)

  // draw each frame
  var lastTime = 0
  return ({ context, width, height, time }) => {
      const dt = time - lastTime
      lastTime = time

      context.globalAlpha = 1.0
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)

      context.strokeStyle = 'black'
      context.lineWidth = 1 / width / params.zoom

      context.setTransform(params.zoom*width/2, 0, 0, params.zoom*height/2, +width/2, +height/2);
      planets.forEach((planet) => planet.update(dt * params.speed) )
      context.globalAlpha = 0.2
      planets.forEach((planet) => planet.drawLine(context))
      context.globalAlpha = 1.0
      planets.forEach((planet) => planet.draw(context))
  };
};

canvasSketch(sketch, settings);
