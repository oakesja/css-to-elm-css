'use strict'

const propLookups = require('./propLookups')
const selectorLookups = require('./selectorLookups')
const valueLookups = require('./valueLookups')

class Stringifier {

  constructor (builder) {
    this.builder = builder
  }

  stringify (node) {
    this[node.type](node)
  }

  root (node) {
    this.builder('stylesheet\n    [')
    this.body(node)
    this.builder('\n    ]')
  }

  // TODO
  comment (node) {
    // let left = this.raw(node, 'left', 'commentLeft')
    // let right = this.raw(node, 'right', 'commentRight')
    // this.builder('/*' + left + node.text + right + '*/', node)
  }

  decl (node) {
    let prop = this.propName(node.prop, node.value)
    let values = node.value.split(' ').map(this.lookupValue)
    let string = prop + ' ' + values.join(' ')

    // TODO important
    // if (node.important) {
    //   string += node.raws.important || ' !important'
    // }
    this.builder(string, node)
  }

  propName (name, value) {
    let arity = value.split(' ').length
    if (propLookups.singleArityPropsLookup[name]) {
      return propLookups.singleArityPropsLookup[name]
    }
    if (propLookups.multiArityPropsLookup[name] && propLookups.multiArityPropsLookup[name][arity]) {
      return propLookups.multiArityPropsLookup[name][arity]
    }
    // TODO handle not found
    return ''
  }

  lookupValue (value) {
    var lengthMatch = /^(-?\d*\.{0,1}\d+)(\S+)$/.exec(value)
    var hexMatch = /^(#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))$/.exec(value)
    if (valueLookups.simple[value]) {
      return valueLookups.simple[value]
    }
    if (lengthMatch && valueLookups.lengths[lengthMatch[2]]) {
      return '(' + valueLookups.lengths[lengthMatch[2]] + ' ' + lengthMatch[1] + ')'
    }
    if (hexMatch) {
      return '(hex "' + hexMatch[1] + '")'
    }
    return ''
  }

  rule (node) {
    this.block(node, node.selector)
  }

  // TODO
  atrule (node) {
    // let name = '@' + node.name
    // let params = node.params ? this.rawValue(node, 'params') : ''
    //
    // if (typeof node.raws.afterName !== 'undefined') {
    //   name += node.raws.afterName
    // } else if (params) {
    //   name += ' '
    // }
    //
    // if (node.nodes) {
    //   this.block(node, name + params)
    // } else {
    //   let end = (node.raws.between || '') + (semicolon ? ';' : '')
    //   this.builder(name + params + end, node)
    // }
  }

  body (node) {
    let last = node.nodes.length - 1
    while (last > 0) {
      if (node.nodes[last].type !== 'comment') break
      last -= 1
    }
    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i]
      if (i > 0) {
        if (node.type == 'root') {
          this.builder('\n    , ')
        } else {
          this.builder('\n        , ')
        }
      } else {
        this.builder(' ')
      }
      this.stringify(child)
    }
  }

  block (node, start) {
    this.builder(this.specifier(start) + '\n        [', node, 'start')
    if (node.nodes && node.nodes.length) {
      this.body(node)
    }
    this.builder('\n        ]', node, 'end')
  }

  specifier (name) {
    if (name.startsWith('.')) {
      return selectorLookups.selectorLookup['class'] + ' "' + name.substring(1) + '"'
    } else if (name.startsWith('#')) {
      return selectorLookups.selectorLookup['id'] + ' "' + name.substring(1) + '"'
    } else if (selectorLookups.elements.find(function (x) { return x === name })) {
      return name
    }
    return selectorLookups.selectorLookup['selector'] + ' "' + name + '"'
  }
}

module.exports.Stringifier = Stringifier
