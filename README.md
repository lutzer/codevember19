# Codevember 2019

One sketch per day in dark november. Sketches can be found here: [https://lutzer.github.io/codevember19/](https://lutzer.github.io/codevember19/)

## Setup

* run `npm install canvas-sketch-cli -g`
* run `npm install`

## Run

* run `npm run day{n}`
* build with `npm run build sketches/{sketch_name.js}`

## Develop 

* to create new run `canvas-sketch {sketch_name.js} --new`
* for hot reload run `canvas-sketch {sketch_name.js} --hot`
* deploy with `canvas-sketch {sketch_name.js} --build`

## Export

* ouput gif with `canvas-sketch {sketch_name.js}  --output=docs --stream=gif`
* build inline html with `canvas-sketch {sketch_name.js}  --dir docs --build --inline`
