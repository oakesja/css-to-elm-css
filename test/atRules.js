import test from 'ava'
import intercept from 'intercept-stdout'
import {testCssToElm} from './helpers/helpers'
import cssToElm from '../index'

test.beforeEach(t => {
  t.context.capturedError = ''
  t.context.unhook = intercept(() => {}, (error) => {
    t.context.capturedError += error
  })
})

test.afterEach.always(t => {
  t.context.unhook()
})

testCssToElm(
  'atRules are not supported',
  '@keyframes .class { 0% { top: 0; } }',
  'stylesheet [ ]'
)

testCssToElm(
  'atRules are skipped',
  '.class { padding: inherit; } @keyframes .class { 0% { top: 0; } }',
  'stylesheet [ class "class" [ padding inherit ] ]'
)

// TODO fix
// test('atRule warnings are outputed to stderr', t => {
//   const css = '@keyframes .class { 0% { top: 0; } }'
//   return cssToElm(css, 'my_file.css').then(generated => {
//     const warning = `at-rule-unsupported: ${process.cwd()}/my_file.css:1:1: At-Rules are currently unsupported in elm-css.`
//     t.is(t.context.capturedError.trim(), warning)
//   })
// })
