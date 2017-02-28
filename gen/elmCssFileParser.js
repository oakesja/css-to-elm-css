import ElmFileParser from './elmFileParser'
import TypeFinder from './typeFinder'
import {execRegex} from './common'

// TODO Favor composition over inheritance
export default class extends ElmFileParser {

  constructor (file) {
    super(file)
    this.categories = [
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
      this.selector(),
      this.unknown()
    ]
    this.categorizedFunctions = {}
    this.categories.forEach(c => c.initialize(this.categorizedFunctions))
    this.typeFinder = new TypeFinder(this.typeAliases())
  }

  // TODO this should not worry about clashingNames, return fullyQualifiedName as part of it instead
  getFunctions (clashingNames) {
    this.categorizeFunctions(clashingNames)
    return this.categorizedFunctions
  }

  categorizeFunctions (clashingNames) {
    for (const name of this.exposedFunctionNames) {
      this.categorizeFunction(name, clashingNames)
    }
  }

  categorizeFunction (name, clashingNames) {
    const category = this.categories.find(c => c.functionIs(name))
    const lookupName = this.handleNameClash(clashingNames, name)
    category.categorizeFunction(name, lookupName)
  }

  property () {
    return this.createCategorizer(
      'properties',
      {},
      name => !!this.cssPropertyName(name),
      (name, lookupName) => {
        const cssPropName = this.cssPropertyName(name)
        const params = this.functionParameters(name)
        const propInfo = {
          name: name,
          paramemterTypes: this.typeFinder.paramsToTypes(params)
        }
        this.categorizedFunctions.properties[cssPropName] ?
          this.categorizedFunctions.properties[cssPropName].push(propInfo) :
          this.categorizedFunctions.properties[cssPropName] = [propInfo]
      }
    )
  }

  pseudoClass () {
    return this.createCategorizer(
      'pseudoClasses',
      {},
      this.categorizeIfBodyContains('Structure.PseudoClassSelector'),
      this.categorizer('pseudoClasses', this.findCssNameFromComment)
    )
  }

  pseudoElement () {
    return this.createCategorizer(
      'pseudoElements',
      {},
      this.categorizeIfBodyContains('Structure.PseudoElement'),
      this.categorizer('pseudoElements', this.findCssNameFromComment)
    )
  }

  angle () {
    return this.createCategorizer(
      'angles',
      {},
      this.categorizeIfBodyContains('angleConverter'),
      this.categorizer('angles', this.findCssNameFromComment)
    )
  }

  colorFunction () {
    return this.createCategorizer(
      'colorFunctions',
      {},
      name => this.functionReturnType(name) === 'Color',
      this.categorizer('colorFunctions', this.colorFunctionCssName)
    )
  }

  length () {
    return this.createCategorizer(
      'lengths',
      {},
      this.categorizeIfBodyContains('lengthConverter'),
      this.categorizer('lengths', this.lengthCssName)
    )
  }

  value () {
    return this.createCategorizer(
      'simpleValues',
      {},
      name => {
        return this.functionBody(name).includes('value =') &&
          this.functionArity(name) == 0
      },
      this.categorizer('simpleValues', this.cssValueName)
    )
  }

  transformFunction () {
    return this.createCategorizer(
      'tranformFunctions',
      {},
      name => {
        return this.functionBody(name).includes('value =') &&
          this.functionReturnType(name) === 'Transform'
      },
      this.categorizer('tranformFunctions', this.findCssNameFromComment)
    )
  }

  important () {
    return this.createCategorizer(
      'important',
      null,
      this.categorizeIfCommentContains('!important'),
      (name, lookupName) => {
        this.categorizedFunctions['important'] = lookupName
      }
    )
  }

  id () {
    return this.createCategorizer(
      'selectors',
      {},
      this.categorizeIfCommentContains('id selector'),
      (name, lookupName) => {
        this.categorizedFunctions.selectors['id'] = lookupName
      }
    )
  }

  class () {
    return this.createCategorizer(
      'selectors',
      {},
      this.categorizeIfCommentContains('class selector'),
      (name, lookupName) => {
        this.categorizedFunctions.selectors['class'] = lookupName
      }
    )
  }

  selector () {
    return this.createCategorizer(
      'selectors',
      {},
      this.categorizeIfCommentContains('custom selector'),
      (name, lookupName) => {
        this.categorizedFunctions.selectors['selector'] = lookupName
      }
    )
  }

  unknown () {
    return this.createCategorizer(
      'unusedCssFunctions',
      [],
      name => true,
      (name, lookupName) => this.categorizedFunctions.unusedCssFunctions.push(name)
    )
  }

  createCategorizer (categoryName, initialValue, is, setter) {
    return {
      functionIs: is,
      categorizeFunction: setter,
      initialize: (categorizedFunctions) => categorizedFunctions[categoryName] = initialValue
    }
  }

  categorizeIfBodyContains (str) {
    return name => this.functionBody(name).includes(str)
  }

  categorizeIfCommentContains (str) {
    return name => this.functionComment(name).includes(str)
  }

  categorizer (category, findName) {
    return (name, lookupName) => {
      this.categorizedFunctions[category][findName.call(this, name)] = lookupName
    }
  }

  colorFunctionCssName (name) {
    const match = /cssFunction "(\S*)"/g.exec(this.functionBody(name))
    return (match && match[1]) || 'hex'
  }

  findCssNameFromComment (name) {
    return execRegex(
      this.functionComment(name),
      /\[`(\S*)`\]/,
      `Failed to find css name for: ${name}`
    )[1]
  }

  lengthCssName (name) {
    return execRegex(
      this.functionBody(name),
      /lengthConverter (?:\S*) "(\S*)"/,
      'Failed to find length name for' + name
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
 }
