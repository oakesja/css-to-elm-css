import {execRegex, reverseString} from './common'
import escapeStringRegexp from 'escape-string-regexp'
import fs from 'fs'

export default class {
  constructor (filePath) {
    this.filePath = filePath
    this.file = fs.readFileSync(filePath, 'utf8')
    this.exposedNames = this.findExposedNames()
    this.exposedFunctionNames = this.findExposedFunctionNames().sort()
    this.moduleName = this.findModuleName()
  }

  getFunctionNames (clashingsNames) {
    let result = {}
    this.exposedFunctionNames.forEach(name => {
      result[name] = this.handleNameClash(clashingsNames, name)
    }, this)
    return result
  }

  handleNameClash (clashingsNames, name) {
    return clashingsNames.includes(name) ? this.fullyQualifiedName(name) : name
  }

  fullyQualifiedName (functionName) {
    return `${this.moduleName}.${functionName}`
  }

  findExposedNames () {
    const regex = /exposing\s*\(((.|\n)*?)(?:\w|\s)\)/
    const errorMsg = 'Failed to find exposed names'
    const result = execRegex(this.file, regex, errorMsg)
    return result[1].replace(/\s/g, '').split(',')
  }

  findExposedFunctionNames () {
    const self = this
    return this.exposedNames.filter(function (name) {
      return new RegExp(`^${escapeStringRegexp(name)} :`, 'm').test(self.file)
    })
  }

  findModuleName () {
    return execRegex(
      this.file,
      /module (\S*)\s*exposing/,
      'Failed to find the module name for' + this.filePath
    )[1]
  }

  functionComment (functionName) {
    const name = escapeStringRegexp(reverseString(functionName + ' :'))
    const regex = new RegExp(name + '\\n\\}-((.|\\n)*?)\\|-\\{')
    const errorMsg = `Failed find comment for function: ${functionName}`
    return reverseString(execRegex(reverseString(this.file), regex, errorMsg)[1])
  }

  functionBody (functionName) {
    const name = escapeStringRegexp(functionName)
    const regex = new RegExp(`\n${name} (?:.*)=\s*((.|\n)*?)\n(\n\n|$)`, 'g')
    const errorMsg = `Failed find body for function: ${functionName}`
    return execRegex(this.file, regex, errorMsg)[1]
  }

  functionSignature (functionName) {
    const name = escapeStringRegexp(functionName)
    const regex = new RegExp(`^${name} :((?:.|\n)*)\n^${name} (?:.*)=$`, 'm')
    const errorMsg = `Failed find signature for function: ${functionName}`
    const signature = execRegex(this.file, regex, errorMsg)[1]
    return signature.split('->').map(function (x) { return x.trim() })
  }

  functionReturnType (functionName) {
    const signature = this.functionSignature(functionName)
    return signature[signature.length - 1]
  }

  functionArity (functionName) {
    return this.functionSignature(functionName).length - 1
  }
 }
