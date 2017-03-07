import basicFunctions from './basicFunctions'
import LookupFile from './lookupFile'
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
    const lookupFile = new LookupFile()
    lookupFile.addLookup('properties', properties)
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
    lookupFile.addLookup('values', cssFunctions.values)
    lookupFile.generate('src/valueLookups.js')
  }

  outputUnused (unusedCssFunctions) {
    console.log(`Total functions in Css.elm = ${this.cssFileParser.exposedFunctionNames.length}`)
    console.log(`Total unused functions used in lookups = ${unusedCssFunctions.length}`)
    console.log('Unused functions: ')
    console.log(unusedCssFunctions)
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
