const random = require('canvas-sketch-util/random');
const _ = require("lodash")

class Planet {
    constructor(options) {
      this.options = Object.assign({
        mass : 0.1, 
        distance : 0, 
        steps : 1, 
        parent : null, 
        color : 'black',
        steps : 4,
        note : 'C1',
        triggerCallback : () => {}
      }, options)
  
      
      // position in radians
      this.angle = random.range(0, 2*Math.PI)
      this.triggerDistance = 0.0
      this.pulse = 0.0
    }
  
    getPosition() {
      const { parent, distance } = this.options
      if (!parent)
        return [0, 0]
      
      const center = parent.getPosition()
      return [ center[0] + Math.cos(this.angle) * distance, center[1] + Math.sin(this.angle) * distance ]
      
    }
  
    update(dt) {
      // update angle
      const { distance, parent, steps } = this.options

      if (distance == 0)
        return

      this.angle = (this.angle + dt * 1/distance) % (Math.PI*2)

      // check if a step got triggered
      const newTriggerDistance = (this.angle / (Math.PI*2) * steps) % 1
      if (newTriggerDistance < this.triggerDistance) {
        this.options.triggerCallback(this.options)
        this.pulse = 0.20
      }

      this.triggerDistance = newTriggerDistance
      this.pulse = Math.max(0, this.pulse - dt)
    }
  
    draw(context) {
      const { color, mass } = this.options
      var pos = this.getPosition();
  
      // fill circle
      context.fillStyle = color
      context.beginPath()
      context.arc(pos[0],pos[1], (1+this.pulse) * mass, 0, 2*Math.PI);
      context.closePath()
      context.fill()
      context.stroke()
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

export { Planet }