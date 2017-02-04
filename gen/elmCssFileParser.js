import ElmFileParser from './elmFileParser'
import {execRegex} from './common'

export default class extends ElmFileParser {

  isProperty (functionName) {
    return !!this.cssPropertyName(functionName)
  }

  isPseudoClass (functionName) {
    return this.functionBodyContains(functionName, 'Structure.PseudoClassSelector')
  }

  isPseudoElement (functionName) {
    return this.functionBodyContains(functionName, 'Structure.PseudoElement')
  }

  isAngleValue (functionName) {
    return this.functionBodyContains(functionName, 'angleConverter')
  }

  isColorFunction (functionName) {
    return this.functionReturnType(functionName) === 'Color'
  }

  islengthValue (functionName) {
    return this.functionBodyContains(functionName, 'lengthConverter')
  }

  isCssValue (functionName) {
    return this.functionBodyContains(functionName, 'value =') &&
      this.functionArity(functionName) == 0
  }

  isTransformFunction (functionName) {
    return this.functionBodyContains(functionName, 'value =') &&
      this.functionReturnType(functionName) === 'Transform {}'
  }

  isImportant (functionName) {
    return this.functionCommentContains(functionName, '!important')
  }

  isIdSelector (functionName) {
    return this.functionCommentContains(functionName, 'id selector')
  }

  isClassSelector (functionName) {
    return this.functionCommentContains(functionName, 'class selector')
  }

  isCustomSelector (functionName) {
    return this.functionCommentContains(functionName, 'custom selector')
  }

  findCssNameFromComment (functionName) {
    const comment = this.functionComment(functionName)
    return execRegex(comment, /\[`(\S*)`\]/, `Failed to find css name for: ${functionName}`)[1]
  }

  colorFunctionCssName (functionName) {
    const match = /cssFunction "(\S*)"/g.exec(this.functionBody(functionName))
    return (match && match[1]) || 'hex'
  }

  lengthCssName (functionName) {
    return execRegex(
      this.functionBody(functionName),
      /lengthConverter (?:\S*) "(\S*)"/,
      'Failed to find value name for' + functionName
    )[1]
  }

  cssValueName (functionName) {
    return execRegex(
      this.functionBody(functionName),
      /value = "(\S*)"/,
      'Failed to find css value for: ' + functionName
    )[1]
  }

  cssPropertyName (functionName) {
    const body = this.functionBody(functionName)
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

  functionBodyContains (functionName, str) {
    return this.functionBody(functionName).includes(str)
  }

  functionCommentContains (functionName, str) {
    return this.functionComment(functionName).includes(str)
  }
 }
