const canvasSketch = require('canvas-sketch')
const  { lerp } = require('canvas-sketch-util/math')
const { noise3D, noise2D, noise1D }  = require('canvas-sketch-util/random');
const _ = require('lodash')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  duration: 20,
  fps: 60
}

 // function drawDivision(context, start,end) {
    
  // }

const sketch = () => {
  const margin = 20

  const createDivisions = (number, playhead) => Array(number).fill(0).map( (val, index) => {
    return { 
      start: noise3D(index, playhead, 1) / 2 + 0.5,
      end: noise3D(index, playhead, 2) / 2 + 0.5,
      offset: noise2D(index, playhead) / 10,
      direction: Math.round(noise1D(index))
    }
  })

  return ({ context, width, height, playhead }) => {
    context.fillStyle = 'white'
    context.fillRect(0, 0, width, height)

    const divisions = createDivisions(20,playhead)

    divisions.forEach( ({start, end, offset, direction}, index) => {
      context.fillStyle = "black"
      context.globalAlpha = 0.8
      let p1,p2,p3
      if (direction == 0) { 
        p1 = index % 2 == 0 ? [start * width, margin] : [margin, start * height]
        p2 = index % 2 == 0 ? [end * width, height - margin] : [width - margin, end * height]
        p3 = index % 2 == 0 ? [p2[0] + offset * width, p2[1]] : [p2[0], p2[1] + offset * height]
      } else {
        p1 = index % 2 == 0 ? [start * width, margin] : [margin, start * height]
        p2 = index % 2 == 0 ? [p1[0] + offset * width, p1[1]] : [p1[0], p1[1] + offset * height]
        p3 = index % 2 == 0 ? [end * width, height - margin] : [width - margin, end * height]
      }
      

      //console.log(p1,p2)

      context.beginPath()
      context.moveTo(p1[0], p1[1])
      context.lineTo(p2[0], p2[1])
      context.lineTo(p3[0], p3[1])
      context.lineTo(p1[0], p1[1])
      context.closePath()
      context.fill()
    })
  };
};

canvasSketch(sketch, settings);
