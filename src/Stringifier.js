import {properties} from './propLookups'
import {selectors, elements, pseudoClasses, pseudoElements} from './selectorLookups'
import {valuesLookup, important} from './valueLookups'
import valueParser from 'postcss-value-parser'

const INDENT = '    '
const FLOAT = 'float'
const INT = 'int'

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
    if (node.nodes.length == 0) return
    while (node.nodes[0].type === 'comment') {
      this.comment(node.nodes.shift())
    }
    let endComments = []
    while (node.nodes[node.nodes.length - 1].type === 'comment') {
      endComments.unshift(node.nodes.pop())
    }
    this.writeLine('stylesheet')
    this.elmArray(node.nodes, this.body)
    endComments.forEach(this.comment, this)
  }

  rule (node) {
    this.appendToLine(this.selector(node.selector) + '\n')
    this.elmArray(node.nodes, this.body)
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

  decl (node) {
    const declaration =
      this.declarationFromTypes(node) ||
      this.specialDeclarations(node) ||
      `property "${node.prop}" "${node.value}"`
    this.appendToLine(declaration + '\n', node)
  }

  declarationFromTypes (node) {
    const propertyFunctions = this.lookupPotentialPropertyFunctions(node.prop)
    const values = this.lookupValues(node.value)
    for (let propertyFunc of propertyFunctions) {
      const parameters = propertyFunc.paramemterTypes
      if (parameters.length == 1 && parameters[0].type === 'list') {
        const isMatch = values.every(value => this.isSubset(parameters[0].paramTypes.paramTypes, value.returnTypes))
        if (isMatch) {
          return `${propertyFunc.name} [ ${values.map(v => v.functionName).join(', ')} ]`
        }
      } else {
        if (parameters.length != values.length) {
          continue
        }
        const isMatch = parameters.every((paramType, i) => {
          return this.isSubset(paramType.paramTypes, values[i].returnTypes)
        })
        if (isMatch) {
          return `${propertyFunc.name} ${values.map(v => v.functionName).join(' ')}`
        }
      }
    }
  }

  lookupPotentialPropertyFunctions (propertyName) {
    const propertyFunctions = properties[propertyName]
    return propertyFunctions || []
  }

  lookupValues (value) {
    const values =
      valueParser(value)
        .nodes
        .filter(node => ['word', 'function'].includes(node.type))
        .map(node => valuesLookup[node.value])
    const anyUndefined = values.some(v => !v)
    return anyUndefined ? [] : values
  }

  isSubset (subset, superset) {
    return subset.every(x => superset.includes(x))
  }

  specialDeclarations (node) {
    if (node.prop === 'display' && node.value === 'flex') {
      return 'displayFlex'
    }
  }

  // helper methods
  body (nodes) {
    for (let i = 0; i < nodes.length; i++) {
      let child = nodes[i]
      if (child.type === 'atrule') continue
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
    } else if (Object.keys(elements).includes(name)) {
      return elements[name]
    }
    return `${selectors['selector']} "${name}"`
  }

  lookupValue (valueNode) {
    if (valueNode.type === 'word') {
      return this.simpleValue(valueNode.value) ||
        this.lengthValue(valueNode.value) ||
        this.hexColorValue(valueNode.value)
    }
    if (valueNode.type === 'function') {
      return this.rgbColorValue(valueNode) ||
        this.rgbaColorValue(valueNode)
    }
  }

  simpleValue (value) {
    if (simpleValues[value]) return simpleValues[value]
  }

  lengthValue (value) {
    var lengthMatch = /^(-?\d*\.{0,1}\d+)(\S+)$/.exec(value)
    if (lengthMatch && lengthFuncs[lengthMatch[2]]) {
      return this.elmFunctionCall(lengthFuncs[lengthMatch[2]], parseFloat(lengthMatch[1]))
    }
  }

  hexColorValue (value) {
    if (value.startsWith('#')) {
      return this.elmFunctionCall(colorFuncs.hex, this.elmString(value))
    }
  }

  rgbColorValue (value) {
    let colorValues = value.nodes.filter(v => v.type === 'word').map(v => v.value)
    if (value.value === 'rgb' && this.elmTypesAre(colorValues, [INT, INT, INT])) {
      return this.elmFunctionCall(colorFuncs.rgb, ...colorValues)
    }
  }

  rgbaColorValue (value) {
    let colorValues = value.nodes.filter(v => v.type === 'word').map(v => v.value)
    if (value.value === 'rgba' && this.elmTypesAre(colorValues, [INT, INT, INT, FLOAT])) {
      return this.elmFunctionCall(colorFuncs.rgba, ...colorValues)
    }
  }

  elmArray (array, arrayWriter) {
    this.indents++
    if (array.length == 0) {
      this.writeLine('[')
    } else {
      this.writeLineStart('[ ')
      arrayWriter.call(this, array)
    }
    this.writeLine(']')
    this.indents--
  }

  elmFunctionCall (name, ...values) {
    return `(${name} ${values.join(' ')})`
  }

  elmString (str) {
    return `"${str.replace(/"/g, '\\"')}"`
  }

  elmTypesAre (values, expected) {
    if (values.length != expected.length) return false
    let types = values.map(this.elmType, this)
    return types.every((t, i) => t === expected[i])
  }

  elmType (value) {
    if (/^-?\d+$/.exec(value)) return INT
    if (/^-?\d*\.{0,1}\d+$/.exec(value)) return FLOAT
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
