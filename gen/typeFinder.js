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

    // TODO leak abastraction
  lookupTypeForParam (p) {
    if (p.type == 'typeAdt' && this.cssValueTypes[p.value]) {
      return {
        type: 'cssValue',
        paramTypes: this.cssValueTypes[p.value]
      }
    } else if (p.type === 'typeAdt' && p.value === 'List') {
      return {
        type: 'list',
        paramTypes: this.lookupTypeForParam(p.params[0])
      }
    } else if (p.type === 'typeAdt' && this.primitives.includes(p.value)) {
      return {
        type: 'primitive',
        paramTypes: [p.value]
      }
    } else if (p.type === 'typeBracket') {
      return this.lookupTypeForParam(p.element)
    } else if (p.type === 'typeFun') {
      return this.lookupTypeForParam(p.signature[0])
    } else {
      console.log(p)
      return []
    }
  }
 }
