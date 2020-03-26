const canvasSketch = require("canvas-sketch");
const load = require('load-asset');
const parseCsv = require('csv-parse/lib/sync')
const _ = require('lodash')
const { lerpFrames, mapRange } = require('canvas-sketch-util/math');
const { setCaption, setTitle, getPixels, wait } = require('./utils')
const palettes = require('nice-color-palettes');
const random = require('canvas-sketch-util/random');
const { noise3D }  = require('canvas-sketch-util/random');

const settings = {
  dimensions: [ 768, 384 ],
  animate: true,
  duration: 20
}

const params = {
  timeout: 1000,
  lonBins: 60,
  latBins: 60/2,
  dataUrl: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
  localDataUrl: 'assets/day08/time_series_covid19_confirmed_global.csv'
}

function easeInOutQuad(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t }

const sketch = async ({ context, height, width }) => {

  // load data
  var rawdata = ""
  try {
    rawdata = await Promise.race([ 
      load({ url: params.dataUrl, type: 'text' }),
      wait(params.timeout).then( () => {throw "timeout"})
    ]);
  } catch (err) {
    rawdata = await load({ url: params.localDataUrl, type: 'text' });
  }

  const colors = random.shuffle(random.pick(palettes));
  const offsets = [ 1/params.lonBins/2, 1/params.latBins/2 ]
  const texture = await load({ url: 'assets/day08/world_without_poles.jpg', type: 'image'})

  // parse data and put them into bins depending on geo location
  const data = parseCsv(rawdata, { from_line: 2 }).map( (line) => {
    let coords = [ Number(line[2]), Number(line[3])]
    let latBin = Math.round(mapRange(coords[0], 90, -90, 0, params.latBins))
    let lonBin = Math.round(mapRange(coords[1], -180, 180, 0, params.lonBins))
    return {
      name: line[1],
      coords: coords,
      values: line.slice(4).map(Number),
      bin: latBin * params.lonBins + lonBin
    }
  })

  const totalDays = data[0].values.length

  // construct bin array
  const binData = data.reduce( (acc, curr) => {
    acc[Math.min(curr.bin, params.lonBins * params.latBins-1)].push(curr)
    return acc
  }, _.map(Array(params.lonBins * params.latBins), () => []))

  // check if bin is in water or land
  const pixels = getPixels(texture, width, height);
  const landBins = _.range(0,binData.length).map( (index) => {
    const bin = [ index % params.lonBins, Math.floor(index / params.lonBins)]
    const p = [ Math.floor((bin[0] / params.lonBins + offsets[0]) * width), Math.floor((bin[1] / params.latBins + offsets[1]) * height) ] 
    let val = pixels.data[(p[1] * width + p[0]) * 4]
    return val < 255
  })

  // add color and landinformation to bins
  const bins = _.zip(binData, landBins).map( ([d,isLand]) => {
    return {
      data: d,
      land: isLand,
      color: random.pick(colors)
    }
  })

  //calculate maximum cases of all bins
  const maxCases = bins.reduce( (acc, { data }) => {
    if (_.isEmpty(data))
      return acc

    let valueArray = _.map(data, (ele) => ele.values)
    let caseArray = _.map(_.unzip(valueArray), _.sum)
    return Math.max(acc, _.max(caseArray))
  }, 0)

  const maxDotSize = Math.min( height/params.latBins, width/ params.lonBins ) * 0.5

  setTitle(`Cases starting from 22nd of January`, settings.dimensions)

  // draw each frame
  return ({ context, width, height, playhead, time }) => {
    let t = easeInOutQuad(playhead)

    context.globalAlpha = 1.0
    context.fillStyle = 'black'
    context.fillRect(0, 0, width, height)

    bins.forEach( (ele, index) => {

      let bin = [ (index % params.lonBins), Math.floor(index / params.lonBins) ]

      let x = (bin[0] / params.lonBins + offsets[0]) * width
      let y = (bin[1] / params.latBins + offsets[1]) * height

      if (ele.land) {

        context.fillStyle = 'white'
        context.globalAlpha = mapRange(noise3D(time, bin[0], bin[1] ), -1, 1, 0.1, 1.0)
        context.beginPath()
        context.arc(x, y, 1.0, 0, 2*Math.PI);
        context.closePath()
        context.fill()

      }

      if (!_.isEmpty(ele.data)) {
        let cases = ele.data.reduce( (acc, curr) => {
          return acc + lerpFrames(_.concat([0],curr.values,[0]), t)
        }, 0)

        let radius = Math.log(1+cases)/Math.log(maxCases) * maxDotSize

        context.fillStyle = ele.color
        context.globalAlpha = 1.0

        context.beginPath()
        context.arc(x, y, radius, 0, 2*Math.PI);
        context.closePath()
        context.fill()
      }
      
    })

    var day = Math.floor(t*totalDays)
    setCaption(`Day ${day}`, settings.dimensions)

  };
};

canvasSketch(sketch, settings);
