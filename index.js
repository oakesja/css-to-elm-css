import postcss from 'postcss'
import Stringifier from './src/Stringifier'

export default function cssToElm (css, filename = '') {
  return postcss([atRulePlugin])
        .process(css, {
          from: filename,
          stringifier: stringify
        })
        .then(result => {
          printAnyWarnings(result)
          return result.css
        })
}

const atRulePlugin = postcss.plugin('at-rule-unsupported', () => {
  return (root, result) => {
    root.walkAtRules(decl => {
      decl.warn(result, 'At-Rules are currently unsupported in elm-css.')
    })
  }
})

function stringify (node, builder) {
  let str = new Stringifier(builder)
  str.stringify(node)
}

function printAnyWarnings (result) {
  result.warnings().forEach(warn => {
    console.warn(warn.toString())
  })
}
