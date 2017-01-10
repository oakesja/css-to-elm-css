'use strict'

const postcss = require('postcss')
const fs = require('fs')
const propLookups = require('./src/propLookups')

const defaultRaw = {
  colon: ': ',
  indent: '    ',
  beforeDecl: '\n',
  beforeRule: '\n',
  beforeOpen: ' ',
  beforeClose: '\n',
  beforeComment: '\n',
  after: '\n',
  emptyBody: '',
  commentLeft: ' ',
  commentRight: ' '
}

function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1)
}

class Stringifier {

  constructor (builder) {
    this.builder = builder
  }

  stringify (node, semicolon) {
    this[node.type](node, semicolon)
  }

  root (node) {
    this.builder('stylesheet [\n')
    this.body(node)
    this.builder(']')
  }

  comment (node) {
    let left = this.raw(node, 'left', 'commentLeft')
    let right = this.raw(node, 'right', 'commentRight')
    this.builder('/*' + left + node.text + right + '*/', node)
  }

  decl (node, semicolon) {
    let prop = this.propName(node.prop, node.value)
    let string = prop + ' ' + this.rawValue(node, 'value')

    // if (node.important) {
    //   string += node.raws.important || ' !important'
    // }
    this.builder(string, node)
  }

  propName (name, value) {
    let arity = value.split(' ').length
    if (propLookups.singleArityPropsLookup[name]) {
      return propLookups.singleArityPropsLookup[name]
    }
    if (propLookups.multiArityPropsLookup[name] && propLookups.multiArityPropsLookup[name][arity]) {
      return propLookups.multiArityPropsLookup[name][arity]
    }
    // TODO handle not found
    return ''
  }

  rule (node) {
    this.block(node, this.rawValue(node, 'selector'))
  }

  atrule (node, semicolon) {
    let name = '@' + node.name
    let params = node.params ? this.rawValue(node, 'params') : ''

    if (typeof node.raws.afterName !== 'undefined') {
      name += node.raws.afterName
    } else if (params) {
      name += ' '
    }

    if (node.nodes) {
      this.block(node, name + params)
    } else {
      let end = (node.raws.between || '') + (semicolon ? ';' : '')
      this.builder(name + params + end, node)
    }
  }

  body (node) {
    let last = node.nodes.length - 1
    while (last > 0) {
      if (node.nodes[last].type !== 'comment') break
      last -= 1
    }
    let semicolon = this.raw(node, 'semicolon')
    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i]
      if (i > 0) {
        this.builder('\n   , ')
      } else {
        this.builder(' ')
      }
      this.stringify(child, last !== i || semicolon)
    }
  }

  specifier (name) {
    if (name.startsWith('.')) {
      return '(.) "' + name.substring(1) + '"'
    } else {
      console.error('Invalid specifier:' + name)
      return name
    }
  }

  block (node, start) {
    this.builder(this.specifier(start) + ' [', node, 'start')

    let after
    if (node.nodes && node.nodes.length) {
      this.body(node)
      after = this.raw(node, 'after')
    } else {
      after = this.raw(node, 'after', 'emptyBody')
    }

    if (after) this.builder(after)
    this.builder(']', node, 'end')
  }

  raw (node, own, detect) {
    let value
    if (!detect) detect = own

        // Already had
    if (own) {
      value = node.raws[own]
      if (typeof value !== 'undefined') return value
    }

    let parent = node.parent

        // Hack for first rule in CSS
    if (detect === 'before') {
      if (!parent || parent.type === 'root' && parent.first === node) {
        return ''
      }
    }

        // Floating child without parent
    if (!parent) return defaultRaw[detect]

        // Detect style by other nodes
    let root = node.root()
    if (!root.rawCache) root.rawCache = { }
    if (typeof root.rawCache[detect] !== 'undefined') {
      return root.rawCache[detect]
    }

    if (detect === 'before' || detect === 'after') {
      return this.beforeAfter(node, detect)
    } else {
      let method = 'raw' + capitalize(detect)
      if (this[method]) {
        value = this[method](root, node)
      } else {
        root.walk(i => {
          value = i.raws[own]
          if (typeof value !== 'undefined') return false
        })
      }
    }

    if (typeof value === 'undefined') value = defaultRaw[detect]

    root.rawCache[detect] = value
    return value
  }

  beforeAfter (node, detect) {
    let value
    if (node.type === 'decl') {
      value = this.raw(node, null, 'beforeDecl')
    } else if (node.type === 'comment') {
      value = this.raw(node, null, 'beforeComment')
    } else if (detect === 'before') {
      value = this.raw(node, null, 'beforeRule')
    } else {
      value = this.raw(node, null, 'beforeClose')
    }

    let buf = node.parent
    let depth = 0
    while (buf && buf.type !== 'root') {
      depth += 1
      buf = buf.parent
    }

    if (value.indexOf('\n') !== -1) {
      let indent = this.raw(node, null, 'indent')
      if (indent.length) {
        for (let step = 0; step < depth; step++) value += indent
      }
    }

    return value
  }

// TODO why is this needed
  rawValue (node, prop) {
    let value = node[prop]
    let raw = node.raws[prop]
    if (raw && raw.value === value) {
      return raw.raw
    } else {
      return value
    }
  }

}

// --------------------------------------------------------------------------------------------

function stringify (node, builder) {
	    let str = new Stringifier(builder)
	    str.stringify(node)
}

exports.cssToElmCss = function (css) {
  return postcss([])
      .process(css, { stringifier: stringify })
      .then(result => result.css)
      // TODO transform error?
}

// fs.readFile('app.css', (err, css) => {
//     postcss([])
//         .process(css, { from: 'app.css', to: 'gen.css', stringifier: stringify })
//         .then(result => {
//             fs.writeFile('gen.css', result.css);
//             if ( result.map ) fs.writeFile('app.css.map', result.map);
//         });
// });
