import test from 'ava'
import {cssToElmCss} from '../index'
import {expectContentsEqual} from './helpers/helpers'

test('single arity property functions', t => {
  const css = '.class { text-align: inherit; }'
  const expected = 'stylesheet [ (.) "class" [ textAlign inherit ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('multi arity property functions', t => {
  const css = '.class { padding: inherit inherit; }'
  const expected = 'stylesheet [ (.) "class" [ padding2 inherit inherit ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})
