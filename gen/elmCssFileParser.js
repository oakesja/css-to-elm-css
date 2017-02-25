import ElmFileParser from './elmFileParser'
import TypeFinder from './typeFinder'
import {execRegex} from './common'

// Favor composition over inheritance
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
    this.typeFinder = new TypeFinder(this.typeAliases())
  }

  getFunctions (clashingNames) {
    this.categorizeFunctions(clashingNames)
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

  categorizeFunctions (clashingNames) {
    for (const name of this.exposedFunctionNames) {
      this.categorizeFunction(name, clashingNames)
    }
  }

  categorizeFunction (name, clashingNames) {
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
    const lookupName = this.handleNameClash(clashingNames, name)
    type ? type.categorizeFunction(name, lookupName) : this.unusedCssFunctions.push(name)
  }

  property () {
    return {
      functionIs: (name) => {
        return !!this.cssPropertyName(name)
      },
      categorizeFunction: (name, lookupName) => {
        const cssPropName = this.cssPropertyName(name)
        const params = this.functionParameters(name)
        const propInfo = {
          name: name,
          paramemterTypes: this.typeFinder.paramsToTypes(params)
        }
        this.properties[cssPropName] ?
          this.properties[cssPropName].push(propInfo) :
          this.properties[cssPropName] = [propInfo]
      }
    }
  }

  pseudoClass () {
    return {
      functionIs: (name) => {
        return this.functionBodyContains(name, 'Structure.PseudoClassSelector')
      },
      categorizeFunction: (name, lookupName) => {
        this.pseudoClasses[this.findCssNameFromComment(name)] = lookupName
      }
    }
  }

  pseudoElement () {
    return {
      functionIs: (name) => {
        return this.functionBodyContains(name, 'Structure.PseudoElement')
      },
      categorizeFunction: (name, lookupName) => {
        this.pseudoElements[this.findCssNameFromComment(name)] = lookupName
      }
    }
  }

  angle () {
    return {
      functionIs: (name) => {
        return this.functionBodyContains(name, 'angleConverter')
      },
      categorizeFunction: (name, lookupName) => {
        this.angles[this.findCssNameFromComment(name)] = lookupName
      }
    }
  }

  colorFunction () {
    return {
      functionIs: (name) => {
        return this.functionReturnType(name) === 'Color'
      },
      categorizeFunction: (name, lookupName) => {
        this.colorFunctions[this.colorFunctionCssName(name)] = lookupName
      }
    }
  }

  length () {
    return {
      functionIs: (name) => {
        return this.functionBodyContains(name, 'lengthConverter')
      },
      categorizeFunction: (name, lookupName) => {
        this.lengths[this.lengthCssName(name)] = lookupName
      }
    }
  }

  value () {
    return {
      functionIs: (name) => {
        return this.functionBodyContains(name, 'value =') && this.functionArity(name) == 0
      },
      categorizeFunction: (name, lookupName) => {
        this.simpleValues[this.cssValueName(name)] = lookupName
      }
    }
  }

  transformFunction () {
    return {
      functionIs: (name) => {
        return this.functionBodyContains(name, 'value =') && this.functionReturnType(name) === 'Transform'
      },
      categorizeFunction: (name, lookupName) => {
        this.tranformFunctions[this.findCssNameFromComment(name)] = lookupName
      }
    }
  }

  important () {
    return {
      functionIs: (name) => {
        return this.functionCommentContains(name, '!important')
      },
      categorizeFunction: (name, lookupName) => {
        this.importantFunction = lookupName
      }
    }
  }

  id () {
    return {
      functionIs: (name) => {
        return this.functionCommentContains(name, 'id selector')
      },
      categorizeFunction: (name, lookupName) => {
        this.selectors['id'] = lookupName
      }
    }
  }

  class () {
    return {
      functionIs: (name) => {
        return this.functionCommentContains(name, 'class selector')
      },
      categorizeFunction: (name, lookupName) => {
        this.selectors['class'] = lookupName
      }
    }
  }

  selector () {
    return {
      functionIs: (name) => {
        return this.functionCommentContains(name, 'custom selector')
      },
      categorizeFunction: (name, lookupName) => {
        this.selectors['selector'] = lookupName
      }
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
