import fs from 'fs'

export default class {
  constructor () {
    this.lookups = []
  }

  addLookup (name, lookup) {
    this.lookups.push([name, lookup])
  }

  generate (fileName) {
    const file = this.lookups.map(([name, lookup]) => {
      return `export const ${name} = ${JSON.stringify(lookup, null, '  ')};`
    }).join('\n\n')
    fs.writeFileSync(fileName, file)
  }
}
