'use strict'

const postcss = require('postcss')
const fs = require('fs')
const Stringifier = require('./src/Stringifier')

function stringify (node, builder) {
  let str = new Stringifier.Stringifier(builder)
  str.stringify(node)
}

exports.cssToElmCss = function (css) {
  return postcss([])
        .process(css, {
          stringifier: stringify
        })
        .then(result => result.css)
    // TODO transform error?
}

fs.readFile('app.css', (err, css) => {
  this.cssToElmCss(css)
        .then(result => {
          fs.writeFile('gen.elm', result)
        })
})
