import {singleArityProps, multiArityProps, listProps} from './propLookups'
import {selectors, elements, pseudoClasses, pseudoElements} from './selectorLookups'
import {lengthValues, angleValues, colorValues, simpleValues, transformValues, important} from './valueLookups'

const INDENT = '    '

export default class Stringifier {

  constructor (builder) {
    this.builder = builder
  }

  stringify (node, indents = 0) {
    this.indents = indents
    this[node.type](node)
  }

  // node types
  root (node) {
    while (node.nodes[0].type === 'comment') {
      this.comment(node.nodes.shift())
    }
    let endComments = []
    while (node.nodes[node.nodes.length - 1].type === 'comment') {
      endComments.unshift(node.nodes.pop())
    }
    this.writeLine('stylesheet')
    this.elmArray(this.body, node)
    endComments.forEach(this.comment, this)
  }

  rule (node) {
    this.appendToLine(this.selector(node.selector) + '\n')
    this.elmArray(this.body, node)
  }

  // currently unsupported in elm-css
  atrule (node) {
  }

  comment (node) {
    if (node.source.start.line == node.source.end.line) {
      this.writeLine(`-- ${node.text}`, node)
    } else {
      this.writeLine(`{-|${node.raws.left}${node.text}${node.raws.right}-}`, node)
    }
  }

// TODO clean up
  decl (node) {
    let prop = this.lookupPropName(node.prop, node.value)
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

    if (node.important) {
      string = `${important} (${string})`
    }
    this.appendToLine(string + '\n', node)
  }

  // helper methods
  body (node) {
    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i]
      if (child.type === 'atrule') { continue }
      if (i > 0 && child.type !== 'comment') {
        this.writeLineStart(', ')
      }
      this.stringify(child, this.indents)
    }
  }

  selector (name) {
    if (name.startsWith('.')) {
      return `${selectors['class']} "${name.substring(1)}"`
    } else if (name.startsWith('#')) {
      return `${selectors['id']} "${name.substring(1)}"`
    } else if (elements.includes(name)) {
      return name
    }
    return `${selectors['selector']} "${name}"`
  }

  lookupPropName (name, value) {
    let arity = value.split(' ').length
    return singleArityProps[name] || (multiArityProps[name] && multiArityProps[name][arity])
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

  elmArray (writeArray, ...args) {
    this.indents++
    this.writeLineStart('[ ')
    writeArray.call(this, ...args)
    this.writeLine(']')
    this.indents--
  }

  writeLine (str, ...args) {
    this.writeLineStart(str + '\n')
  }

  writeLineStart (str, ...args) {
    this.builder(`${INDENT.repeat(this.indents)}${str}`, args)
  }

  appendToLine (str, ...args) {
    this.builder(str, args)
  }
}
