import basicFunctions from './basicFunctions'
import LookupFile from './lookupFile'
import {execRegex, createCssFileParser, createElmFileParser} from './common'

export default class {
  constructor () {
    this.cssFileParser = createCssFileParser('../elm-css/src/Css.elm')
    this.elementsFileParser = createElmFileParser('../elm-css/src/Css/Elements.elm')
    this.properties = {}
    this.pseudoClasses = {}
    this.pseudoElements = {}
    this.angles = {}
    this.colorFunctions = {}
    this.lengths = {}
    this.simpleValues = {}
    this.tranformFunctions = {}
    this.unusedCssFunctions = []
  }

  // findClashingNames () {
  //   let results = []
  //   basicFunctions.concat(
  //     this.cssFileParser.exposedFunctionNames,
  //     this.elementsFileParser.exposedFunctionNames,
  //     this.colorsFileParser.exposedFunctionNames
  //   ).sort().forEach((name, index, array) => {
  //     if (index < array.length - 1 && name == array[index + 1]) {
  //       results.push(name)
  //     }
  //   })
  //   return results
  // }

  generate () {
    this.categorizeFunctions()
    this.createPropLookups()
    this.createSelectorLookups()
    this.createValueLookups()
    console.log(`Total functions in Css.elm = ${this.cssFileParser.exposedFunctionNames.length}`)
    console.log(`Total unused functions used in lookups = ${this.unusedCssFunctions.length}`)
    console.log('Unused functions: ')
    console.log(this.unusedCssFunctions)
  }

  categorizeFunctions () {
    for (const name of this.cssFileParser.exposedFunctionNames) {
      this.categorizeFunction(name)
    }
  }

  categorizeFunction (name) {
    if (this.cssFileParser.isProperty(name)) {
      const propName = this.cssFileParser.cssPropertyName(name)
      this.properties[propName] ?
        this.properties[propName].push(name) :
        this.properties[propName] = [name]
    } else if (this.cssFileParser.isPseudoClass(name)) {
      this.pseudoClasses[this.cssFileParser.findCssNameFromComment(name)] = name
    } else if (this.cssFileParser.isPseudoElement(name)) {
      this.pseudoElements[this.cssFileParser.findCssNameFromComment(name)] = name
    } else if (this.cssFileParser.isAngleValue(name)) {
      this.angles[this.cssFileParser.findCssNameFromComment(name)] = name
    } else if (this.cssFileParser.isAngleValue(name)) {
      this.angles[this.cssFileParser.findCssNameFromComment(name)] = name
    } else if (this.cssFileParser.isColorFunction(name)) {
      this.colorFunctions[this.cssFileParser.colorFunctionCssName(name)] = name
    } else if (this.cssFileParser.islengthValue(name)) {
      this.lengths[this.cssFileParser.lengthCssName(name)] = name
    } else if (this.cssFileParser.isCssValue(name)) {
      this.simpleValues[this.cssFileParser.cssValueName(name)] = name
    } else if (this.cssFileParser.isTransformFunction(name)) {
      this.tranformFunctions[this.cssFileParser.findCssNameFromComment(name)] = name
    } else if (this.cssFileParser.isImportant(name)) {
      this.importantFunction = name
    } else if (this.cssFileParser.isIdSelector(name)) {
      this.idFunction = name
    } else if (this.cssFileParser.isClassSelector(name)) {
      this.classFunction = name
    } else if (this.cssFileParser.isCustomSelector(name)) {
      this.customSelectorFunction = name
    } else {
      this.unusedCssFunctions.push(name)
    }
  }

  createPropLookups () {
    const cssProps = this.createCssPropLookups()
    const lookupFile = new LookupFile()
    lookupFile.addLookup('singleArityProps', cssProps['singleArity'])
    lookupFile.addLookup('multiArityProps', cssProps['multiArity'])
    lookupFile.addLookup('listProps', cssProps['listProps'])
    lookupFile.generate('src/propLookups.js')
  }

  createSelectorLookups () {
    const lookupFile = new LookupFile()
    lookupFile.addLookup('selectors', this.createSelectorLookup())
    lookupFile.addLookup('elements', this.elementsFileParser.exposedFunctionNames)
    lookupFile.addLookup('pseudoClasses', this.pseudoClasses)
    lookupFile.addLookup('pseudoElements', this.pseudoElements)
    lookupFile.generate('src/selectorLookups.js')
  }

  createValueLookups () {
    const lookupFile = new LookupFile()
    lookupFile.addLookup('important', this.importantFunction)
    lookupFile.addLookup('lengthFuncs', this.lengths)
    lookupFile.addLookup('angleFuncs', this.angles)
    lookupFile.addLookup('colorFuncs', this.colorFunctions)
    lookupFile.addLookup('simpleValues', this.simpleValues)
    lookupFile.addLookup('transformFuncs', this.tranformFunctions)
    lookupFile.generate('src/valueLookups.js')
  }

  createSelectorLookup () {
    return {
      id: this.idFunction,
      class: this.classFunction,
      selector: this.customSelectorFunction
    }
  }

  createCssPropLookups () {
    const singleArity = {}
    const multiArity = {}
    const listProps = {}
    const allProps = this.properties
    for (const key in allProps) {
      const functions = allProps[key]
      if (functions.length == 1) {
        singleArity[key] = functions[0]
      } else if (functions.length > 1 && functions.some(function (x) { return /^(\w+)\d$/.test(x) })) {
        multiArity[key] = {}
        for (const func of functions) {
          const arity = parseInt(func.charAt(func.length - 1)) || 1
          multiArity[key][arity] = func
        }
      } else if (functions.length == 2 && functions.every(function (x) { return /^(\w+)[^0-9]$/.test(x) })) {
        const single = functions.find(function (x) { return !this.cssFileParser.functionSignature(x)[0].includes('List') }, this)
        const list = functions.find(function (x) { return this.cssFileParser.functionSignature(x)[0].includes('List') }, this)
        listProps[key] = {
          single: single,
          list: list
        }
      } else {
        console.log('Failed to classify css property: ' + key)
      }
    }
    return {
      singleArity: singleArity,
      multiArity: multiArity,
      listProps: listProps
    }
  }
}
