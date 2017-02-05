import basicFunctions from './basicFunctions'
import LookupFile from './lookupFile'
import {execRegex} from './common'
import ElmCssFileParser from './elmCssFileParser'
import ElmFileParser from './elmFileParser'

export default class {
  constructor () {
    this.cssFileParser = new ElmCssFileParser('../elm-css/src/Css.elm')
    this.elementsFileParser = new ElmFileParser('../elm-css/src/Css/Elements.elm')
    this.colorsFileParser = new ElmFileParser('../elm-css/src/Css/Colors.elm')
    this.clashingNames = this.findClashingNames()
  }

  generate () {
    const cssFunctions = this.cssFileParser.getFunctions(this.clashingNames)
    this.createPropLookups(cssFunctions.properties)
    this.createSelectorLookups(cssFunctions)
    this.createValueLookups(cssFunctions)
    this.outputUnused(cssFunctions.unusedCssFunctions)
  }

  createPropLookups (properties) {
    const {singleArity, multiArity, listProps} = this.createCssPropLookups(properties)
    const lookupFile = new LookupFile()
    lookupFile.addLookup('singleArityProps', singleArity)
    lookupFile.addLookup('multiArityProps', multiArity)
    lookupFile.addLookup('listProps', listProps)
    lookupFile.generate('src/propLookups.js')
  }

  createSelectorLookups (cssFunctions) {
    const lookupFile = new LookupFile()
    lookupFile.addLookup('selectors', cssFunctions.selectors)
    lookupFile.addLookup('elements', this.elementsFileParser.getFunctionNames(this.clashingNames))
    lookupFile.addLookup('pseudoClasses', cssFunctions.pseudoClasses)
    lookupFile.addLookup('pseudoElements', cssFunctions.pseudoElements)
    lookupFile.generate('src/selectorLookups.js')
  }

  createValueLookups (cssFunctions) {
    const lookupFile = new LookupFile()
    lookupFile.addLookup('important', cssFunctions.important)
    lookupFile.addLookup('lengthFuncs', cssFunctions.lengths)
    lookupFile.addLookup('angleFuncs', cssFunctions.angles)
    lookupFile.addLookup('colorFuncs', cssFunctions.colorFunctions)
    lookupFile.addLookup('simpleValues', cssFunctions.simpleValues)
    lookupFile.addLookup('transformFuncs', cssFunctions.tranformFunctions)
    lookupFile.generate('src/valueLookups.js')
  }

  outputUnused (unusedCssFunctions) {
    console.log(`Total functions in Css.elm = ${this.cssFileParser.exposedFunctionNames.length}`)
    console.log(`Total unused functions used in lookups = ${unusedCssFunctions.length}`)
    console.log('Unused functions: ')
    console.log(unusedCssFunctions)
  }

  createCssPropLookups (allProps) {
    const singleArity = {}
    const multiArity = {}
    const listProps = {}
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

  findClashingNames () {
    let results = []
    basicFunctions.concat(
      this.cssFileParser.exposedFunctionNames,
      this.elementsFileParser.exposedFunctionNames,
      this.colorsFileParser.exposedFunctionNames
    ).sort().forEach((name, index, array) => {
      if (index < array.length - 1 && name == array[index + 1]) {
        results.push(name)
      }
    })
    return results
  }
}
