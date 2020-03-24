const canvasSketch = require("canvas-sketch");
const load = require('load-asset');
const parseCsv = require('csv-parse/lib/sync')
const _ = require('lodash')
const { lerpFrames, mapRange } = require('canvas-sketch-util/math');
const { setCaption, setTitle, getPixels, wait, setCanvasPadding } = require('./utils')
const palettes = require('nice-color-palettes');
const random = require('canvas-sketch-util/random');
const { noise3D }  = require('canvas-sketch-util/random');

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  duration: 20
}

const params = {
  timeout: 1000,
  lonBins: 60,
  latBins: 60/2,
  dataUrl: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'
}

function polarToCartesian(latitude, longitude, radius = 1) {
  const x = 2*radius * Math.cos(latitude) * Math.cos(longitude)
  const y = 2*radius * Math.cos(latitude) * Math.sin(longitude)
  const z = 2*radius * Math.sin(latitude)
  return [ x, y, z]
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
    rawdata = await load({ url: 'assets/day08/time_series_2019-ncov-Confirmed.csv', type: 'text' });
  }

  const colors = random.shuffle(random.pick(palettes));

  // parse data and put them into bins depending on geo location
  const data = parseCsv(rawdata, { from_line: 2 }).map( (line) => {
    let coords = [ Number(line[2]), Number(line[3])]
    let latBin = Math.floor(mapRange(coords[0], 90, -90, 0, params.latBins))
    let lonBin = Math.floor(mapRange(coords[1], -180, 180, 0, params.lonBins))
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
    acc[curr.bin].push(curr)
    return acc
  }, _.map(Array(params.lonBins * params.latBins), () => []))

  // add color to bins
  const bins = binData.map( (d) => {
    return {
      data: d,
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

  const maxDotSize = Math.min( height/params.latBins, width/ params.lonBins ) * 0.7

  setTitle(`Cases starting from 22nd of January`, settings.dimensions)

  // draw each frame
  return ({ context, width, height, playhead }) => {
    let t = easeInOutQuad(playhead)

    context.globalAlpha = 1.0
    context.fillStyle = 'black'
    context.fillRect(0, 0, width, height)

    bins.forEach( (ele, index) => {

      let lon = mapRange(index % params.lonBins, 0, params.lonBins, -Math.PI, +Math.PI)
      let lat = mapRange(Math.floor(index / params.lonBins), 0, params.latBins, -Math.PI/2, +Math.PI/2)

      let [x,y,z] = polarToCartesian(lat,lon, height/6);

      if (!_.isEmpty(ele.data)) {
        let cases = ele.data.reduce( (acc, curr) => {
          return acc + lerpFrames(_.concat([0],curr.values,[0]), t)
        }, 0)

        let radius = Math.log(1+cases)/Math.log(maxCases) * maxDotSize

        let n = mapRange(noise3D(x/2,y/2, playhead*50), -1, 1, 0.8, 1.0)

        context.fillStyle = ele.color
        context.globalAlpha = 1.0

        let offset = [ noise3D(x,y,0+playhead*50) * 5, noise3D(x,y,1+playhead*10) * 5 ]

        context.beginPath()
        context.arc(x + offset[0] + width/2 , y + offset[1] + height/2, radius * n, 0, 2*Math.PI);
        context.closePath()
        context.fill()
      }
      
    })

    var day = Math.floor(t*totalDays)
    setCaption(`Day ${day}`, settings.dimensions)

  };
};

canvasSketch(sketch, settings);
