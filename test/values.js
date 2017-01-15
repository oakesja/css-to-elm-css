import {testCssToElm} from './helpers/helpers'

testCssToElm(
  'value with arity 0',
  '.name { padding: inherit }',
  'stylesheet [ (.) "name" [ padding inherit ] ]'
)

testCssToElm(
  'positive lengths',
  '.name { padding: 10px }',
  'stylesheet [ (.) "name" [ padding (px 10) ] ]'
)

testCssToElm(
  'negative lengths',
  '.name { padding: -1.345% }',
  'stylesheet [ (.) "name" [ padding (pct -1.345) ] ]'
)

testCssToElm(
  'hex color with 3 letters',
  '.name { color: #F0f }',
  'stylesheet [ (.) "name" [ color (hex "#F0f") ] ]'
)

testCssToElm(
  'hex color with 6 letters',
  '.name { color: #F0fF0f }',
  'stylesheet [ (.) "name" [ color (hex "#F0fF0f") ] ]'
)

// TODO angles with transforms
// TODO hex color invalid length and invalid characters
// TODO rgb,rgba,hsl,hsla colors and invalid args
// TODO urls
// TODO integers https://developer.mozilla.org/en-US/docs/Web/CSS/integer
// TODO numbers https://developer.mozilla.org/en-US/docs/Web/CSS/number
// TODO unknown
