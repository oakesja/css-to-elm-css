import ElmFileParser from './elmFileParser'
import CssTypeFinder from './cssTypeFinder'
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
    this.cssTypeFinder = new CssTypeFinder(this.typeAliases())
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
    // const lookupName = this.handleNameClash(clashingNames, name)
    category.categorizeFunction(name)
  }

  property () {
    return this.createCategorizer(
      'properties',
      {},
      name => !!this.cssPropertyName(name),
      (categoryName, name) => {
        const cssPropName = this.cssPropertyName(name)
        const params = this.functionParameters(name)
        const propInfo = {
          name: name,
          paramemterTypes: this.cssTypeFinder.paramsToTypes(params)
        }
        let properties = this.categorizedFunctions[categoryName]
        properties[cssPropName] ?
          properties[cssPropName].push(propInfo) :
          properties[cssPropName] = [propInfo]
      }
    )
  }

  pseudoClass () {
    return this.createCategorizer(
      'pseudoClasses',
      {},
      this.categorizeIfBodyContains('Structure.PseudoClassSelector'),
      this.categorizer(this.findCssNameFromComment, name => name)
    )
  }

  pseudoElement () {
    return this.createCategorizer(
      'pseudoElements',
      {},
      this.categorizeIfBodyContains('Structure.PseudoElement'),
      this.categorizer(this.findCssNameFromComment, name => name)
    )
  }

  angle () {
    return this.createCategorizer(
      'angles',
      {},
      this.categorizeIfBodyContains('angleConverter'),
      this.cssValueCategorizer(this.findCssNameFromComment)
    )
  }

  colorFunction () {
    return this.createCategorizer(
      'colorFunctions',
      {},
      name => this.returnTypeIs(name, 'Color'),
      this.cssValueCategorizer(this.colorFunctionCssName)
    )
  }

  length () {
    return this.createCategorizer(
      'lengths',
      {},
      this.categorizeIfBodyContains('lengthConverter'),
      this.cssValueCategorizer(this.lengthCssName)
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
      this.cssValueCategorizer(this.cssValueName)
    )
  }

  transformFunction () {
    return this.createCategorizer(
      'tranformFunctions',
      {},
      name => {
        return this.functionBody(name).includes('value =') &&
          this.returnTypeIs(name, 'Transform')
      },
      this.cssValueCategorizer(this.findCssNameFromComment)
    )
  }

  important () {
    return this.createCategorizer(
      'important',
      null,
      this.categorizeIfCommentContains('!important'),
      (categoryName, name) => {
        this.categorizedFunctions[categoryName] = name
      }
    )
  }

  id () {
    return this.createCategorizer(
      'selectors',
      {},
      this.categorizeIfCommentContains('id selector'),
      (categoryName, name) => {
        this.categorizedFunctions[categoryName]['id'] = name
      }
    )
  }

  class () {
    return this.createCategorizer(
      'selectors',
      {},
      this.categorizeIfCommentContains('class selector'),
      (categoryName, name) => {
        this.categorizedFunctions[categoryName]['class'] = name
      }
    )
  }

  selector () {
    return this.createCategorizer(
      'selectors',
      {},
      this.categorizeIfCommentContains('custom selector'),
      (categoryName, name) => {
        this.categorizedFunctions[categoryName]['selector'] = name
      }
    )
  }

  unknown () {
    return this.createCategorizer(
      'unusedCssFunctions',
      [],
      name => true,
      (categoryName, name) => this.categorizedFunctions[categoryName].push(name)
    )
  }

  createCategorizer (categoryName, initialValue, is, categorizer) {
    return {
      functionIs: is,
      categorizeFunction: categorizer.bind(this, categoryName),
      initialize: (categorizedFunctions) => categorizedFunctions[categoryName] = initialValue
    }
  }

  categorizeIfBodyContains (str) {
    return name => this.functionBody(name).includes(str)
  }

  categorizeIfCommentContains (str) {
    return name => this.functionComment(name).includes(str)
  }

  categorizer (findName, createValue) {
    return (categoryName, name) => {
      const cssName = findName.call(this, name)
      const value = createValue.call(this, name)
      this.categorizedFunctions[categoryName][cssName] = value
    }
  }

  cssValueCategorizer (findName) {
    return this.categorizer(findName, name => {
      return {
        functionName: name,
        params: this.functionParameters(name).map(this.cssValueTypes, this),
        returnTypes: this.cssValueTypes(this.functionReturnType(name))
      }
    })
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

  returnTypeIs (functionName, expectedTypeName) {
    const returnType = this.functionReturnType(functionName)
    return returnType.kind === 'adt' && returnType.value === expectedTypeName
  }

  cssValueTypes (signatureType) {
    switch (signatureType.kind) {
      case 'adt':
        return this.cssTypeFinder.lookupValueTypes(signatureType.value)
      case 'record':
        return this.cssTypesFromRecord(signatureType.fields)
      case 'primitive':
        return [signatureType.value]
      case 'variable':
        if (signatureType.name === 'number') {
          return ['Float', 'Int']
        } else {
          console.warn(`Unknown variable type: ${signatureType.name}`)
        }
      default:
        console.warn(`Unknown signature type: ${signatureType.kind}`)
    }
  }

  cssTypesFromRecord (record) {
    let types = []
    for (let key in record) {
      if (record[key] === 'Compatible') {
        types.push(key)
      }
    }
    return types
  }
}
