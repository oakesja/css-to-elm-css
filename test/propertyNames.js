import test from 'ava'
import {cssToElmCss} from '../index'

function replaceExtraWhitespace (s) {
  return s.replace(/\s+/g, ' ')
}

function expectContentsEqual (t, value, expected) {
  t.is(replaceExtraWhitespace(value), replaceExtraWhitespace(expected))
}

test('single arity property functions', t => {
  const css = '.class { text-align: center; }'
  const expected = 'stylesheet [ (.) "class" [ textAlign center ]]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('multi arity property functions', t => {
  const css = '.class { padding: inherit inherit; }'
  const expected = 'stylesheet [ (.) "class" [ padding2 inherit inherit ]]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})
