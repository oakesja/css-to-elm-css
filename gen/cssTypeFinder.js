export default class {

  constructor (typeAliases) {
    this.primitives = ['String', 'Int', 'Float']
    this.cssValueTypes = this.lookupCssValueTypes(typeAliases)
  }

    // TODO leak abastraction
  lookupCssValueTypes (typeAliases) {
    let types = {}
    typeAliases
      .filter(t => ['typeRecExt', 'typeRec'].includes(t.tipe.type) && t.tipe.fieldDefs.find(f => f.name === 'value'))
      .forEach(t => types[t.value] = t.tipe.fieldDefs.map(f => f.name).filter(n => n !== 'value'))

    typeAliases
      .filter(t => t.tipe.type === 'typeAdt' && types[t.tipe.value])
      .forEach(t => types[t.value] = types[t.tipe.value])

    return types
  }

  paramsToTypes (params) {
    return params.map(p => this.lookupTypeForParam(p))
  }

  lookupValueTypes (type) {
    return this.cssValueTypes[type]
  }

  lookupTypeForParam (p) {
    if (p.kind === 'adt' && this.cssValueTypes[p.value]) {
      return {
        type: 'cssValue',
        paramTypes: this.cssValueTypes[p.value]
      }
    } else if (p.kind === 'list') {
      return {
        type: 'list',
        paramTypes: this.lookupTypeForParam(p.value)
      }
    } else if (p.kind === 'primitive') {
      return {
        type: 'primitive',
        paramTypes: [p.value]
      }
    } else if (p.kind === 'function') {
      return this.lookupTypeForParam(p.parameters[0])
    }
    console.warn('Unknown css type for: ' + JSON.stringify(p))
    return []
  }
 }
