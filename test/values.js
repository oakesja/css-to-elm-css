import {testCssToElm} from './helpers/helpers'

testCssToElm(
  'simple value',
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

testCssToElm(
  'rgb color with numbers',
  '.name { color: rgb(255, 0, 51) }',
  'stylesheet [ (.) "name" [ color (rgb 255 0 51) ] ]'
)

testCssToElm(
  'rgb color with no spaces',
  '.name { color: rgb(255,0,51) }',
  'stylesheet [ (.) "name" [ color (rgb 255 0 51) ] ]'
)

testCssToElm(
  'rgb color with no commas',
  '.name { color: rgb(255 0 51) }',
  'stylesheet [ (.) "name" [ color (rgb 255 0 51) ] ]'
)

testCssToElm(
  'rgb color with percentages',
  '.name { color: rgb(100%, 0%, 20%) }',
  'stylesheet [ (.) "name" [ property "color" "rgb(100%, 0%, 20%)" ] ]'
)

testCssToElm(
  'rgba color with numbers',
  '.name { color: rgba(255, 0, 51, 0.1) }',
  'stylesheet [ (.) "name" [ color (rgba 255 0 51 0.1) ] ]'
)

testCssToElm(
  'rgba color with no spaces',
  '.name { color: rgba(255,0,51,0.1) }',
  'stylesheet [ (.) "name" [ color (rgba 255 0 51 0.1) ] ]'
)

testCssToElm(
  '33% color with no commas',
  '.name { color: rgba(255 0 51 / 0.1) }',
  'stylesheet [ (.) "name" [ color (rgba 255 0 51 0.1) ] ]'
)

testCssToElm(
  'rgba color with percentages',
  '.name { color: rgba(100%, 0%, 20%, 33%) }',
  'stylesheet [ (.) "name" [ property "color" "rgba(100%, 0%, 20%, 33%)" ] ]'
)

testCssToElm(
  'important value',
  '.name { padding: inherit !important }',
  'stylesheet [ (.) "name" [ important (padding inherit) ] ]'
)

testCssToElm(
  'unknown values',
  '.name { color: a }',
  'stylesheet [ (.) "name" [ property "color" "a" ] ]'
)
// TODO angles with transforms
// TODO hex color invalid length and invalid characters
// TODO rgb,rgba,hsl,hsla colors and invalid args
// TODO urls
// TODO integers https://developer.mozilla.org/en-US/docs/Web/CSS/integer
// TODO numbers https://developer.mozilla.org/en-US/docs/Web/CSS/number
// TODO unknown
