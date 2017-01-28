import fs from 'fs'
import ElmFileParser from './elmFileParser'
import LookupFile from './lookupFile'
import {execRegex} from './common'

let globalFuncsUsed = []

export default function () {
  const cssFileParser = new ElmFileParser(fs.readFileSync('../elm-css/src/Css.elm', 'utf8'))
  const elementsFileParser = new ElmFileParser(fs.readFileSync('../elm-css/src/Css/Elements.elm', 'utf8'))
  createPropLookups(cssFileParser)
  createSelectorLookups(cssFileParser, elementsFileParser)
  createValueLookups(cssFileParser)
  console.log(`Total functions used in lookups = ${globalFuncsUsed.length}`)
  console.log(`Total functions in Css.elm = ${cssFileParser.exposedFunctionNames.length}`)
  console.log('Unused functions: ')
  console.log(cssFileParser.exposedFunctionNames.filter(function (x) { return globalFuncsUsed.indexOf(x) == -1 }))
}

function createPropLookups (cssFileParser) {
  const cssProps = createCssPropLookups(cssFileParser)
  const lookupFile = new LookupFile()
  lookupFile.addLookup('singleArityProps', cssProps['singleArity'])
  lookupFile.addLookup('multiArityProps', cssProps['multiArity'])
  lookupFile.addLookup('listProps', cssProps['listProps'])
  lookupFile.generate('src/propLookups.js')
}

function createSelectorLookups (cssFileParser, elementsFileParser) {
  const lookupFile = new LookupFile()
  lookupFile.addLookup('selectors', createSelectorLookup(cssFileParser))
  lookupFile.addLookup('elements', elementsFileParser.exposedFunctionNames)
  lookupFile.addLookup('pseudoClasses', createPseudoClassLookup(cssFileParser))
  lookupFile.addLookup('pseudoElements', createPseudoElementLookup(cssFileParser))
  lookupFile.generate('src/selectorLookups.js')
}

function createValueLookups (cssFileParser) {
  const lookupFile = new LookupFile()
  lookupFile.addLookup('important', findFunctionWithCommentIncluding(cssFileParser, '!important'))
  lookupFile.addLookup('lengthFuncs', createLengthValueLookup(cssFileParser))
  lookupFile.addLookup('angleFuncs', createAngleValueLookup(cssFileParser))
  lookupFile.addLookup('colorFuncs', createColorValueLookup(cssFileParser))
  lookupFile.addLookup('simpleValues', createSimpleValueLookup(cssFileParser))
  lookupFile.addLookup('transformFuncs', createValueTransformLookup(cssFileParser))
  lookupFile.generate('src/valueLookups.js')
}

function createSelectorLookup (cssFileParser) {
  return {
    id: findFunctionWithCommentIncluding(cssFileParser, 'id selector'),
    class: findFunctionWithCommentIncluding(cssFileParser, 'class selector'),
    selector: findFunctionWithCommentIncluding(cssFileParser, 'custom selector')
  }
}

function createPseudoClassLookup (parser) {
  function isPseudoClass (name) {
    return parser.functionBody(name).includes('Structure.PseudoClassSelector')
  }
  const pseudoClasses = parser.exposedFunctionNames.filter(isPseudoClass)
  const lookup = {}
  for (const funcName of pseudoClasses) {
    globalFuncsUsed.push(funcName)
    lookup[findCssNameFromComment(parser, funcName)] = funcName
  }
  return lookup
}

function createPseudoElementLookup (parser) {
  function isPseudoElement (name) {
    return parser.functionBody(name).includes('Structure.PseudoElement')
  }
  const pseudoElements = parser.exposedFunctionNames.filter(isPseudoElement)
  const lookup = {}
  for (const funcName of pseudoElements) {
    globalFuncsUsed.push(funcName)
    lookup[findCssNameFromComment(parser, funcName)] = funcName
  }
  return lookup
}

function createLengthValueLookup (parser) {
  const lengths = {}
  for (const funcName of parser.exposedFunctionNames) {
    const body = parser.functionBody(funcName)
    if (body.includes('lengthConverter')) {
      globalFuncsUsed.push(funcName)
      const value = execRegex(body, /lengthConverter (?:\S*) "(\S*)"/, 'Failed to find value name for' + funcName)
      lengths[value[1]] = funcName
    }
  }
  return lengths
}

function createAngleValueLookup (parser) {
  const angles = {}
  for (const funcName of parser.exposedFunctionNames) {
    const body = parser.functionBody(funcName)
    if (body.includes('angleConverter')) {
      globalFuncsUsed.push(funcName)
      angles[findCssNameFromComment(parser, funcName)] = funcName
    }
  }
  return angles
}

function createSimpleValueLookup (parser) {
  const values = {}
  for (const funcName of parser.exposedFunctionNames) {
    const body = parser.functionBody(funcName)
    const arity = parser.functionArity(funcName)
    if (body.includes('value =') && arity == 0) {
      globalFuncsUsed.push(funcName)
      const valueName = execRegex(body, /value = "(\S*)"/, 'Failed to find css value for: ' + funcName)[1]
      values[valueName] = funcName
    }
  }
  return values
}

function createValueTransformLookup (parser) {
  const values = {}
  for (const funcName of parser.exposedFunctionNames) {
    const body = parser.functionBody(funcName)
    const returnType = parser.functionReturnType(funcName)
    if (body.includes('value =') && returnType === 'Transform {}') {
      globalFuncsUsed.push(funcName)
      values[findCssNameFromComment(parser, funcName)] = funcName
    }
  }
  return values
}

function createColorValueLookup (parser) {
  const values = {}
  for (const funcName of parser.exposedFunctionNames) {
    const returnType = parser.functionReturnType(funcName)
    if (returnType === 'Color') {
      globalFuncsUsed.push(funcName)
      const body = parser.functionBody(funcName)
      const match = /cssFunction "(\S*)"/g.exec(body)
      const valueName = (match && match[1]) || 'hex'
      values[valueName] = funcName
    }
  }
  return values
}

function createCssPropLookups (parser) {
  const singleArity = {}
  const multiArity = {}
  const listProps = {}
  const allProps = createCssPropNameToFunctionNamesLookup(parser)
  for (const key in allProps) {
    const functions = allProps[key]
    globalFuncsUsed = globalFuncsUsed.concat(functions)
    if (functions.length == 1) {
      singleArity[key] = functions[0]
    } else if (functions.length > 1 && functions.some(function (x) { return /^(\w+)\d$/.test(x) })) {
      multiArity[key] = {}
      for (const func of functions) {
        const arity = parseInt(func.charAt(func.length - 1)) || 1
        multiArity[key][arity] = func
      }
    } else if (functions.length == 2 && functions.every(function (x) { return /^(\w+)[^0-9]$/.test(x) })) {
      const single = functions.find(function (x) { return !parser.functionSignature(x)[0].includes('List') })
      const list = functions.find(function (x) { return parser.functionSignature(x)[0].includes('List') })
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

function createCssPropNameToFunctionNamesLookup (parser) {
  const props = {}
  for (const func of parser.exposedFunctionNames) {
    const propName = cssPropertyName(parser, func)
    if (propName) {
      if (props[propName]) {
        props[propName].push(func)
      } else {
        props[propName] = [func]
      }
    }
  }
  return props
}

function findFunctionWithCommentIncluding (cssFileParser, text) {
  const func = cssFileParser.exposedFunctionNames.find(function (name) {
    return cssFileParser.functionComment(name).includes(text)
  })
  globalFuncsUsed.push(func)
  return func
}

function findCssNameFromComment (parser, functionName) {
  const comment = parser.functionComment(functionName)
  return execRegex(comment, /\[`(\S*)`\]/, `Failed to find css name for: ${functionName}`)[1]
}

function isCssProperty (parser, functionName) {
  return !!cssPropertyName(parser, functionName)
}

function cssPropertyName (parser, functionName) {
  const body = parser.functionBody(functionName)
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
