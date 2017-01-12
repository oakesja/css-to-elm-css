'use strict'

var fs = require('fs')
var escapeStringRegexp = require('escape-string-regexp')

class ElmFileParser {
  constructor (file) {
    this.file = file
    this.exposedNames = this.findFunctionNames()
    this.exposedFunctionNames = this.findExposedFunctionNames()
  }

  findFunctionNames () {
    var regex = /exposing\s*\(((.|\n)*?)(?:\w|\s)\)/
    var errorMsg = 'Failed to find exposed functions'
    var result = execRegex(this.file, regex, errorMsg)
    return result[1].replace(/\s/g, '').split(',')
  }

  findExposedFunctionNames () {
    var self = this
    return this.exposedNames.filter(function (name) {
      return new RegExp('^' + escapeStringRegexp(name) + ' : ', 'm').test(self.file)
    }).sort()
  }

  functionComment (functionName) {
    var name = escapeStringRegexp(reverseString(functionName + ' :'))
    var regex = new RegExp(name + '\\n\\}-((.|\\n)*?)\\|-\\{')
    var errorMsg = 'Failed find comment for function: ' + functionName
    return reverseString(execRegex(reverseString(this.file), regex, errorMsg)[1])
  }

  functionBody (functionName) {
    var name = escapeStringRegexp(functionName)
    var regex = new RegExp(name + ' : (?:.*)\n' + name + '(?:.*) =\s*((.|\n)*?)\n(\n|$)')
    var errorMsg = 'Failed find body for function: ' + functionName
    return execRegex(this.file, regex, errorMsg)[1]
  }

  functionSignature (functionName) {
    var name = escapeStringRegexp(functionName)
    var regex = new RegExp('^' + name + ' : (.*)', 'm')
    var errorMsg = 'Failed find signature for function: ' + functionName
    var signature = execRegex(this.file, regex, errorMsg)[1]
    return signature.split('->').map(function (x) { return x.trim() })
  }

  functionReturnType (functionName) {
    var signature = this.functionSignature(functionName)
    return signature[signature.length - 1]
  }

  functionArity (functionName) {
    return this.functionSignature(functionName).length - 1
  }
 }

var globalFuncsUsed = []
var cssFileParser = new ElmFileParser(fs.readFileSync('../elm-css/src/Css.elm', 'utf8'))
var elementsFileParser = new ElmFileParser(fs.readFileSync('../elm-css/src/Css/Elements.elm', 'utf8'))
createPropLookups(cssFileParser)
createSelectorLookups(cssFileParser, elementsFileParser)
createValueLookups(cssFileParser)
console.log(globalFuncsUsed.length)
console.log(cssFileParser.exposedFunctionNames.length)
console.log(cssFileParser.exposedFunctionNames.filter(function (x) { return globalFuncsUsed.indexOf(x) == -1 }))

function createPropLookups (cssFileParser) {
  var cssProps = createCssPropLookups(cssFileParser)
  var generatedFile = ''
  generatedFile += createJsObject('singleArityPropsLookup', cssProps['singleArity'])
  generatedFile += '\n\n'
  generatedFile += createJsObject('multiArityPropsLookup', cssProps['multiArity'])
  generatedFile += '\n\n'
  generatedFile += createJsObject('propsTakeListsLookup', cssProps['listProps'])
  fs.writeFileSync('src/propLookups.js', generatedFile)
}

function createSelectorLookups (cssFileParser, elementsFileParser) {
  var generatedFile = ''
  generatedFile += createJsObject('selectorLookup', createSelectorLookup(cssFileParser))
  generatedFile += '\n\n'
  generatedFile += createJsObject('elements', elementsFileParser.exposedFunctionNames)
  generatedFile += '\n\n'
  generatedFile += createJsObject('pseudoClasses', createPseudoClassLookup(cssFileParser))
  generatedFile += '\n\n'
  generatedFile += createJsObject('pseudoElements', createPseudoElementLookup(cssFileParser))
  fs.writeFileSync('src/selectorLookups.js', generatedFile)
}

function createValueLookups (cssFileParser) {
  var generatedFile = ''
  generatedFile += createJsObject('lengths', createLengthValueLookup(cssFileParser))
  generatedFile += '\n\n'
  generatedFile += createJsObject('angles', createAngleValueLookup(cssFileParser))
  generatedFile += '\n\n'
  generatedFile += createJsObject('simple', createSimpleValueLookup(cssFileParser))
  generatedFile += '\n\n'
  generatedFile += createJsObject('transforms', createValueTransformLookup(cssFileParser))
  generatedFile += '\n\n'
  fs.writeFileSync('src/valueLookups.js', generatedFile)
}

function createSelectorLookup (cssFileParser) {
  function findFunctionWithCommentIncluding (text) {
    return cssFileParser.exposedFunctionNames.find(function (name) {
      return cssFileParser.functionComment(name).includes(text)
    })
  }

  var idSelector = findFunctionWithCommentIncluding('id selector')
  var classSelector = findFunctionWithCommentIncluding('class selector')
  var selector = findFunctionWithCommentIncluding('custom selector')
  globalFuncsUsed.push(idSelector)
  globalFuncsUsed.push(classSelector)
  globalFuncsUsed.push(selector)
  return {
    'id': idSelector,
    'class': classSelector,
    'selector': selector
  }
}

function createPseudoClassLookup (parser) {
  function isPseudoClass (name) {
    return parser.functionBody(name).includes('Structure.PseudoClassSelector')
  }
  var pseudoClasses = parser.exposedFunctionNames.filter(isPseudoClass)
  var lookup = {}
  for (var funcName of pseudoClasses) {
    globalFuncsUsed.push(funcName)
    lookup[findCssNameFromComment(parser, funcName)] = funcName
  }
  return lookup
}

function createPseudoElementLookup (parser) {
  function isPseudoElement (name) {
    return parser.functionBody(name).includes('Structure.PseudoElement')
  }
  var pseudoElements = parser.exposedFunctionNames.filter(isPseudoElement)
  var lookup = {}
  for (var funcName of pseudoElements) {
    globalFuncsUsed.push(funcName)
    lookup[findCssNameFromComment(parser, funcName)] = funcName
  }
  return lookup
}

function createJsObject (name, object, writeValues) {
  return 'exports.' + name + ' = ' + JSON.stringify(object, null, '  ') + ';'
}

function createLengthValueLookup (parser) {
  var lengths = {}
  for (var funcName of parser.exposedFunctionNames) {
    var body = parser.functionBody(funcName)
    if (body.includes('lengthConverter')) {
      globalFuncsUsed.push(funcName)
      lengths[findCssNameFromComment(parser, funcName)] = funcName
    }
  }
  return lengths
}

function createAngleValueLookup (parser) {
  var angles = {}
  for (var funcName of parser.exposedFunctionNames) {
    var body = parser.functionBody(funcName)
    if (body.includes('angleConverter')) {
      globalFuncsUsed.push(funcName)
      angles[findCssNameFromComment(parser, funcName)] = funcName
    }
  }
  return angles
}

function createSimpleValueLookup (parser) {
  var values = {}
  for (var funcName of parser.exposedFunctionNames) {
    var body = parser.functionBody(funcName)
    var arity = parser.functionArity(funcName)
    if (body.includes('value =') && arity == 0) {
      globalFuncsUsed.push(funcName)
      var valueName = execRegex(body, /value = "(\S*)"/, 'Failed to find css value for: ' + funcName)[1]
      values[valueName] = funcName
    }
  }
  return values
}

function createValueTransformLookup (parser) {
  var values = {}
  for (var funcName of parser.exposedFunctionNames) {
    var body = parser.functionBody(funcName)
    var returnType = parser.functionReturnType(funcName)
    if (body.includes('value =') && returnType === 'Transform {}') {
      globalFuncsUsed.push(funcName)
      values[findCssNameFromComment(parser, funcName)] = funcName
    }
  }
  return values
}

function createCssPropLookups (parser) {
  var singleArity = {}
  var multiArity = {}
  var listProps = {}
  var allProps = createCssPropNameToFunctionNamesLookup(parser)
  for (var key in allProps) {
    var functions = allProps[key]
    globalFuncsUsed = globalFuncsUsed.concat(functions)
    if (functions.length == 1) {
      singleArity[key] = functions[0]
    } else if (functions.length > 1 && functions.some(function (x) { return /^(\w+)\d$/.test(x) })) {
      multiArity[key] = {}
      for (var func of functions) {
        var arity = parseInt(func.charAt(func.length - 1)) || 1
        multiArity[key][arity] = func
      }
    } else if (functions.length == 2 && functions.every(function (x) { return /^(\w+)[^0-9]$/.test(x) })) {
      listProps[key] = {
        'single': functions[0],
        'list': functions[1]
      }
    } else {
      console.log('Failed to classify css property: ' + key)
    }
  }
  return {
    'singleArity': singleArity,
    'multiArity': multiArity,
    'listProps': listProps
  }
}

function createCssPropNameToFunctionNamesLookup (parser) {
  var props = {}
  for (var func of parser.exposedFunctionNames) {
    var propName = cssPropertyName(parser, func)
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

function findCssNameFromComment (parser, functionName) {
  var comment = parser.functionComment(functionName)
  return execRegex(comment, /\[`(\S*)`\]/, 'Failed to find css name for: ' + functionName)[1]
}

function isCssProperty (parser, functionName) {
  return !!cssPropertyName(parser, functionName)
}

function cssPropertyName (parser, functionName) {
  var body = parser.functionBody(functionName)
  var propMatch = /(?:prop1|prop2|prop3|prop4|prop5) "(\S+)"/.exec(body)
  var propWarnMatch = /\bpropertyWithWarnings\b (?:\S+) "(\S+)"/.exec(body)
  var propOverloadMatch = /\bgetOverloadedProperty\b (?:\S+) "(\S+)"/.exec(body)
  if (propMatch) { return propMatch[1] }
  if (propWarnMatch) { return propWarnMatch[1] }
  if (propOverloadMatch) { return propOverloadMatch[1] }
  return ''
}

function reverseString (str) {
  return str.split('').reverse().join('')
}

function execRegex (str, regex, errorMsg) {
  var result = regex.exec(str)
  if (result) {
    return result
  }
  throw errorMsg
}
