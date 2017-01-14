import test from 'ava'
import {cssToElmCss} from '../index'
import {expectContentsEqual} from './helpers/helpers'

test('value with arity 0', t => {
  const css = '.name { padding: inherit }'
  const expected = 'stylesheet [ (.) "name" [ padding inherit ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('positive lengths', t => {
  const css = '.name { padding: 10px }'
  const expected = 'stylesheet [ (.) "name" [ padding (px 10) ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('negative lengths', t => {
  const css = '.name { padding: -1.345% }'
  const expected = 'stylesheet [ (.) "name" [ padding (pct -1.345) ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

// TODO angles with transforms
// TODO hex color invalid length and invalid characters

test('hex color with 3 letters', t => {
  const css = '.name { color: #F0f }'
  const expected = 'stylesheet [ (.) "name" [ color (hex "#F0f") ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('hex color with 6 letters', t => {
  const css = '.name { color: #F0fF0f }'
  const expected = 'stylesheet [ (.) "name" [ color (hex "#F0fF0f") ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

