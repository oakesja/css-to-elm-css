
'use strict'

import {singleArityProps, multiArityProps, listProps} from './propLookups'
import {selectors, elements, pseudoClasses, pseudoElements} from './selectorLookups'
import {lengthValues, angleValues, colorValues, simpleValues, transformValues} from './valueLookups'

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
    let hasKnownValues = values.every(function (v) { return !!v })
    let string = ''
    if (prop && hasKnownValues) {
      string = prop + ' ' + values.join(' ')
    } else if (node.prop === 'display' && node.value === 'flex') {
      string = 'displayFlex'
    } else if (listProps[node.prop] && hasKnownValues) {
      if (values.length > 1) {
        string = `${listProps[node.prop]['list']} [ ${values.join(', ')} ]`
      } else {
        string = `${listProps[node.prop]['single']} ${values.join(' ')}`
      }
    } else {
      string = `property "${node.prop}" "${node.value}"`
    }

    // TODO important
    // if (node.important) {
    //   string += node.raws.important || ' !important'
    // }
    this.builder(string, node)
  }

  propName (name, value) {
    let arity = value.split(' ').length
    if (singleArityProps[name]) {
      return singleArityProps[name]
    }
    if (multiArityProps[name] && multiArityProps[name][arity]) {
      return multiArityProps[name][arity]
    }
  }

  lookupValue (value) {
    var lengthMatch = /^(-?\d*\.{0,1}\d+)(\S+)$/.exec(value)
    var hexMatch = /^(#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))$/.exec(value)
    if (simpleValues[value]) {
      return simpleValues[value]
    }
    if (lengthMatch && lengthValues[lengthMatch[2]]) {
      return '(' + lengthValues[lengthMatch[2]] + ' ' + lengthMatch[1] + ')'
    }
    if (hexMatch) {
      return '(hex "' + hexMatch[1] + '")'
    }
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
      return selectors['class'] + ' "' + name.substring(1) + '"'
    } else if (name.startsWith('#')) {
      return selectors['id'] + ' "' + name.substring(1) + '"'
    } else if (elements.find(function (x) { return x === name })) {
      return name
    }
    return selectors['selector'] + ' "' + name + '"'
  }
}

module.exports.Stringifier = Stringifier
