import test from 'ava'
import {cssToElmCss} from '../index'
import {expectContentsEqual} from './helpers/helpers'

test('class selector', t => {
  const css = '.name { }'
  const expected = 'stylesheet [ (.) "name" [ ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('id selector', t => {
  const css = '#name { }'
  const expected = 'stylesheet [ (#) "name" [ ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('html element selector', t => {
  const css = 'body { }'
  const expected = 'stylesheet [ body [ ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})

test('unknown selector', t => {
  const css = '::-webkit-progress-bar { }'
  const expected = 'stylesheet [ selector "::-webkit-progress-bar" [ ] ]'
  return cssToElmCss(css).then(generated => {
    expectContentsEqual(t, generated, expected)
  })
})
