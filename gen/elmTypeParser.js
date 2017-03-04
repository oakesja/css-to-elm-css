const PRIMITIVES = ['String', 'Int', 'Float']

export default function astNodeToType (node) {
  switch (node.type) {
    case 'typeAdt':
      return abstractType(node)
    case 'typeRec':
      return recordType(node)
    case 'typeBracket':
      return astNodeToType(node.element)
    case 'typeFun':
      return functionType(node)
    case 'typeVar':
      return variableType(node)
    case 'typeTuple':
      return tupleType(node)
    default:
      console.warn(`Unknown signature type: ${node.type}`)
      console.warn(node)
  }
}

function abstractType (node) {
  if (node.value === 'List') {
    return listType(node)
  } else if (PRIMITIVES.includes(node.value)) {
    return primitiveType(node)
  }
  return regularType(node)
}

function listType (node) {
  return {
    kind: 'list',
    value: astNodeToType(node.params[0])
  }
}

function primitiveType (node) {
  return {
    kind: 'primitive',
    value: node.value
  }
}

function regularType (node) {
  return {
    kind: 'adt',
    value: node.value
  }
}

function recordType (node) {
  return {
    kind: 'record',
    fields: createTypeRecordLookup(node.fieldDefs)
  }
}

function createTypeRecordLookup (record) {
  return record.reduce((fields, f) => {
    fields[f.name] = f.tipe.value
    return fields
  }, {})
}

function functionType (node) {
  const signature = node.signature
  return {
    kind: 'function',
    parameters: signature.slice(0, signature.length - 1).map(astNodeToType),
    returnType: astNodeToType(signature[signature.length - 1])
  }
}

function variableType (node) {
  return {
    kind: 'variable',
    name: node.value
  }
}

function tupleType (node) {
  return {
    kind: 'tuple',
    values: node.elements.map(astNodeToType)
  }
}
