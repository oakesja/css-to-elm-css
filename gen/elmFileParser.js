import {execRegex, reverseString} from './common'
import fs from 'fs'
import parser from './elmParser'
import astNodeToType from './elmTypeParser'

export default class {
  constructor (filePath) {
    this.file = fs.readFileSync(filePath, 'utf8')
    this.ast = parser.parse(this.file)
    let exposed = this.ast.moduleDeclaration.exposing.exports.exports
    this.exposedNames = exposed.map(e => e.value)
    this.exposedFunctionNames = exposed.filter(e => e.type === 'ref').map(e => e.value).sort()
    this.moduleName = this.ast.moduleDeclaration.value
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

  functionComment (functionName) {
    return this._declarationFor(functionName).doc
  }

  functionBody (functionName) {
    let decl = this._declarationFor(functionName)
    let startLine = decl.annotation ? decl.annotation.location.end.line + 1 : decl.location.start.line
    return this.file
      .split('\n')
      .slice(startLine, decl.location.end.line)
      .join('\n')
  }

  functionSignature (functionName) {
    const signature = this._declarationFor(functionName).annotation.signature
    return signature.map(astNodeToType)
  }

  functionReturnType (functionName) {
    const signature = this.functionSignature(functionName)
    return signature[signature.length - 1]
  }

  functionParameters (functionName) {
    const signature = this.functionSignature(functionName)
    return signature.slice(0, signature.length - 1)
  }

  functionArity (functionName) {
    return this.functionSignature(functionName).length - 1
  }

    // TODO leaky abastraction
  typeAliases () {
    return this.ast.declarations.filter(d => d.type === 'typeAliasDecl')
  }

  _declarationFor (name) {
    return this.ast.declarations.find(d => d.value === name)
  }
 }
