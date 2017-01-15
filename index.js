'use strict'

const postcss = require('postcss')
const Stringifier = require('./src/Stringifier')

function stringify (node, builder) {
  let str = new Stringifier.Stringifier(builder)
  str.stringify(node)
}

function cssToElmCss (css) {
  return postcss([])
        .process(css, {
          stringifier: stringify
        })
        .then(result => result.css)
    // TODO transform error?
}

exports.default = cssToElmCss
