const canvasSketch = require("canvas-sketch");
const load = require('load-asset');
const parseCsv = require('csv-parse/lib/sync')
const _ = require('lodash')
const { lerpFrames, mapRange } = require('canvas-sketch-util/math');
const { setCaption, setTitle } = require('./utils')
const palettes = require('nice-color-palettes');
const random = require('canvas-sketch-util/random');
const distance = require('@turf/distance').default
const turf = require('@turf/helpers')

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  duration: 20
}

const params = {
  lonBins: 40,
  latBins: 40/2,
  dataUrl: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'
}

function polarToCartesian(latitude, longitude, radius = 1) {
  const x = 2*radius * Math.cos(latitude) * Math.cos(longitude)
  const y = 2*radius * Math.cos(latitude) * Math.sin(longitude)
  const z = 2*radius * Math.sin(latitude)
  return [ x, y, z]
}

function getDistance(coord1, coord2) {
  var from = turf.point(coord1);
  var to = turf.point(coord2);
  var options = {units: 'radians'};
 
  return distance(from, to, options);
}

function easeInOutQuad(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t }

const sketch = async ({ context, height, width }) => {

  // load data
  var rawdata = ""
  try {
    rawdata = await load({ url: params.dataUrl, type: 'text' });
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
      bin: latBin * params.lonBins + lonBin,
    }
  })

  //calculate clostest neighbours
  const dots = data.map( (ele) => {
    ele.neighbour = data.reduce( (prev, curr, index) => {
      let dist = getDistance(ele.coords, curr.coords)
      if (dist < prev.dist && dist > 0)
        return { dist : dist, index: index }
      return prev
    }, { dist : Math.PI*2, index: -1 })
    return ele
  })
  const totalDays = data[0].values.length

  console.log(dots)


  setTitle(`Cases starting from 22nd of January`, settings.dimensions)

  // draw each frame
  return ({ context, width, height, playhead }) => {
    let t = easeInOutQuad(playhead)

    // let indicesToPlace = unplacedDots.reduce( (acc, curr, index) => {
    //   let currentValue = lerpFrames(_.concat([0],curr.values,[0]), t)
    //   if (currentValue > 0)
    //     acc.push(index)
    //   return acc
    // },[])

    // let dotsToPlace = _.pullAt(unplacedDots, indicesToPlace)
    // dotsToPlace.forEach( (dot) => {
    //   placedDots.push(dot)
    // })


    // console.log(placedDots.length, unplacedDots.length)
  
    // // let newDots = _.orderBy(_.filter(unplacedDotsWithValue, (ele) => ele.currentValue > 0), 'currentValue', 'desc')



    context.globalAlpha = 1.0
    context.fillStyle = 'white'
    context.fillRect(0, 0, width, height)


    var day = Math.floor(t*totalDays)
    setCaption(`Day ${day}`, settings.dimensions)

  };
};

canvasSketch(sketch, settings);
