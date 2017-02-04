import ElmFileParser from './elmFileParser'
import {execRegex} from './common'

export default class extends ElmFileParser {

  constructor (file) {
    super(file)
    this.properties = {}
    this.pseudoClasses = {}
    this.pseudoElements = {}
    this.angles = {}
    this.colorFunctions = {}
    this.lengths = {}
    this.simpleValues = {}
    this.tranformFunctions = {}
    this.selectors = {}
    this.unusedCssFunctions = []
  }

  getFunctions () {
    this.categorizeFunctions()
    return {
      properties: this.properties,
      pseudoClasses: this.pseudoClasses,
      pseudoElements: this.pseudoElements,
      angles: this.angles,
      colorFunctions: this.colorFunctions,
      lengths: this.lengths,
      simpleValues: this.simpleValues,
      tranformFunctions: this.tranformFunctions,
      unusedCssFunctions: this.unusedCssFunctions,
      important: this.importantFunction,
      selectors: this.selectors
    }
  }

  categorizeFunctions () {
    for (const name of this.exposedFunctionNames) {
      this.categorizeFunction(name)
    }
  }

  categorizeFunction (name) {
    const type = [
      this.property(),
      this.pseudoClass(),
      this.pseudoElement(),
      this.angle(),
      this.colorFunction(),
      this.length(),
      this.value(),
      this.transformFunction(),
      this.important(),
      this.id(),
      this.class(),
      this.selector()
    ].find(type => type.functionIs(name))
    type ? type.categorizeFunction(name) : this.unusedCssFunctions.push(name)
  }

  property () {
    return {
      functionIs: (name) => !!this.cssPropertyName(name),
      categorizeFunction: (name) => {
        const propName = this.cssPropertyName(name)
        this.properties[propName] ?
          this.properties[propName].push(name) :
          this.properties[propName] = [name]
      }
    }
  }

  pseudoClass () {
    return {
      functionIs: (name) => this.functionBodyContains(name, 'Structure.PseudoClassSelector'),
      categorizeFunction: (name) => this.pseudoClasses[this.findCssNameFromComment(name)] = name
    }
  }

  pseudoElement () {
    return {
      functionIs: (name) => this.functionBodyContains(name, 'Structure.PseudoElement'),
      categorizeFunction: (name) => this.pseudoElements[this.findCssNameFromComment(name)] = name
    }
  }

  angle () {
    return {
      functionIs: (name) => this.functionBodyContains(name, 'angleConverter'),
      categorizeFunction: (name) => this.angles[this.findCssNameFromComment(name)] = name
    }
  }
  colorFunction () {
    return {
      functionIs: (name) => this.functionReturnType(name) === 'Color',
      categorizeFunction: (name) => this.colorFunctions[this.colorFunctionCssName(name)] = name
    }
  }
  length () {
    return {
      functionIs: (name) => this.functionBodyContains(name, 'lengthConverter'),
      categorizeFunction: (name) => this.lengths[this.lengthCssName(name)] = name
    }
  }

  value () {
    return {
      functionIs: (name) => this.functionBodyContains(name, 'value =') && this.functionArity(name) == 0,
      categorizeFunction: (name) => this.simpleValues[this.cssValueName(name)] = name
    }
  }
  transformFunction () {
    return {
      functionIs: (name) => this.functionBodyContains(name, 'value =') && this.functionReturnType(name) === 'Transform {}',
      categorizeFunction: (name) => this.tranformFunctions[this.findCssNameFromComment(name)] = name
    }
  }
  important () {
    return {
      functionIs: (name) => this.functionCommentContains(name, '!important'),
      categorizeFunction: (name) => this.importantFunction = name
    }
  }
  id () {
    return {
      functionIs: (name) => this.functionCommentContains(name, 'id selector'),
      categorizeFunction: (name) => this.selectors['id'] = name
    }
  }
  class () {
    return {
      functionIs: (name) => this.functionCommentContains(name, 'class selector'),
      categorizeFunction: (name) => this.selectors['class'] = name
    }
  }
  selector () {
    return {
      functionIs: (name) => this.functionCommentContains(name, 'custom selector'),
      categorizeFunction: (name) => this.selectors['selector'] = name
    }
  }

  findCssNameFromComment (name) {
    const comment = this.functionComment(name)
    return execRegex(comment, /\[`(\S*)`\]/, `Failed to find css name for: ${name}`)[1]
  }

  colorFunctionCssName (name) {
    const match = /cssFunction "(\S*)"/g.exec(this.functionBody(name))
    return (match && match[1]) || 'hex'
  }

  lengthCssName (name) {
    return execRegex(
      this.functionBody(name),
      /lengthConverter (?:\S*) "(\S*)"/,
      'Failed to find value name for' + name
    )[1]
  }

  cssValueName (name) {
    return execRegex(
      this.functionBody(name),
      /value = "(\S*)"/,
      'Failed to find css value for: ' + name
    )[1]
  }

  cssPropertyName (name) {
    const body = this.functionBody(name)
    const propMatch = /(?:prop1|prop2|prop3|prop4|prop5) "(\S+)"/.exec(body)
    const propWarnMatch = /\bpropertyWithWarnings\b (?:\S+) "(\S+)"/.exec(body)
    const propOverloadMatch = /\bgetOverloadedProperty\b (?:\S+) "(\S+)"/.exec(body)
    const transformMatch = /\btransforms\b/.exec(body)
    if (propMatch) { return propMatch[1] }
    if (propWarnMatch) { return propWarnMatch[1] }
    if (propOverloadMatch) { return propOverloadMatch[1] }
    if (transformMatch) { return 'transform' }
    return ''
  }

  functionBodyContains (name, str) {
    return this.functionBody(name).includes(str)
  }

  functionCommentContains (name, str) {
    return this.functionComment(name).includes(str)
  }
 }
