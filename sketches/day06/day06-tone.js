const canvasSketch = require("canvas-sketch");
const palettes = require('nice-color-palettes');
const random = require('canvas-sketch-util/random');
const _ = require('lodash')
const Tone = require('tone')

const { Planet } = require('./planet')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  seed: random.getRandomSeed(),
}

random.setSeed(settings.seed);

const scales = [
  [ 'C', 'A', 'E' ],
  [ 'C' , 'D', 'A' ],
  [ 'C' , 'C#', 'E' ],
  [ 'C' , 'D', 'E' ]
]

const params = {
  speed: .25,
  zoom: 0.4,
  planets: random.range(1,8),
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

  var piano = new Tone.Sampler({
    "A0" : "A0.[mp3|ogg]",
    "C1" : "C1.[mp3|ogg]",
    "D#1" : "Ds1.[mp3|ogg]",
    "F#1" : "Fs1.[mp3|ogg]",
    "A1" : "A1.[mp3|ogg]",
    "C2" : "C2.[mp3|ogg]",
    "D#2" : "Ds2.[mp3|ogg]",
    "F#2" : "Fs2.[mp3|ogg]",
    "A2" : "A2.[mp3|ogg]",
    "C3" : "C3.[mp3|ogg]",
    "D#3" : "Ds3.[mp3|ogg]",
    "F#3" : "Fs3.[mp3|ogg]",
    "A3" : "A3.[mp3|ogg]",
    "C4" : "C4.[mp3|ogg]",
    "D#4" : "Ds4.[mp3|ogg]",
    "F#4" : "Fs4.[mp3|ogg]",
    "A4" : "A4.[mp3|ogg]",
    "C5" : "C5.[mp3|ogg]",
    "D#5" : "Ds5.[mp3|ogg]",
    "F#5" : "Fs5.[mp3|ogg]",
    "A5" : "A5.[mp3|ogg]",
    "C6" : "C6.[mp3|ogg]",
    "D#6" : "Ds6.[mp3|ogg]",
    "F#6" : "Fs6.[mp3|ogg]",
    "A6" : "A6.[mp3|ogg]",
    "C7" : "C7.[mp3|ogg]",
    "D#7" : "Ds7.[mp3|ogg]",
    "F#7" : "Fs7.[mp3|ogg]",
    "A7" : "A7.[mp3|ogg]",
    "C8" : "C8.[mp3|ogg]"
  }, {
    "release" : 1,
    "baseUrl" : "./assets/day06/samples/"
  }).toMaster();

  function triggerHandler(planet) {
    // console.log(['trigger', planet])
    if (piano.loaded)
      piano.triggerAttack(planet.note);
  }

  const colors = random.shuffle(random.pick(palettes))

  const planets = []

  planets.push( new Planet({ mass: 0.1, color: random.pick(colors) }) )
  _.range(params.planets).forEach( (i) => {
    planets.push( new Planet({ 
      id : i,
      mass: random.range(0.05,0.1),
      distance: random.pick([1, 0.5, 0.25]), 
      parent: random.pick(planets), 
      color: random.pick(colors),
      note : random.pick(params.notes) + random.pick(params.octaves),
      steps : random.pick([4]),
      triggerCallback : triggerHandler
    }))
  })

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
