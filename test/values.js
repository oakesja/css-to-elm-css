import {testCssToElm} from './helpers/helpers'

testCssToElm(
  'simple value',
  '.name { padding: inherit }',
  'stylesheet [ class "name" [ padding inherit ] ]'
)

testCssToElm(
  'positive lengths',
  '.name { padding: 10px }',
  'stylesheet [ class "name" [ padding (px 10) ] ]'
)

testCssToElm(
  'negative lengths',
  '.name { padding: -1.345% }',
  'stylesheet [ class "name" [ padding (pct -1.345) ] ]'
)

testCssToElm(
  'lengths without leading number before decimal',
  '.name { padding: .3px }',
  'stylesheet [ class "name" [ padding (px 0.3) ] ]'
)

testCssToElm(
  'hex color with 3 letters',
  '.name { color: #F0f }',
  'stylesheet [ class "name" [ color (hex "#F0f") ] ]'
)

testCssToElm(
  'hex color with 6 letters',
  '.name { color: #F0fF0f }',
  'stylesheet [ class "name" [ color (hex "#F0fF0f") ] ]'
)

testCssToElm(
  'rgb color with numbers',
  '.name { color: rgb(255, 0, 51) }',
  'stylesheet [ class "name" [ color (rgb 255 0 51) ] ]'
)

testCssToElm(
  'rgb color with no spaces',
  '.name { color: rgb(255,0,51) }',
  'stylesheet [ class "name" [ color (rgb 255 0 51) ] ]'
)

testCssToElm(
  'rgb color with no commas',
  '.name { color: rgb(255 0 51) }',
  'stylesheet [ class "name" [ color (rgb 255 0 51) ] ]'
)

testCssToElm(
  'rgb color with percentages',
  '.name { color: rgb(100%, 0%, 20%) }',
  'stylesheet [ class "name" [ property "color" "rgb(100%, 0%, 20%)" ] ]'
)

testCssToElm(
  'rgba color with numbers',
  '.name { color: rgba(255, 0, 51, 0.1) }',
  'stylesheet [ class "name" [ color (rgba 255 0 51 0.1) ] ]'
)

testCssToElm(
  'rgba color with no spaces',
  '.name { color: rgba(255,0,51,0.1) }',
  'stylesheet [ class "name" [ color (rgba 255 0 51 0.1) ] ]'
)

testCssToElm(
  '33% color with no commas',
  '.name { color: rgba(255 0 51 / 0.1) }',
  'stylesheet [ class "name" [ color (rgba 255 0 51 0.1) ] ]'
)

testCssToElm(
  'rgba color with percentages',
  '.name { color: rgba(100%, 0%, 20%, 33%) }',
  'stylesheet [ class "name" [ property "color" "rgba(100%, 0%, 20%, 33%)" ] ]'
)

testCssToElm(
  'important value',
  '.name { padding: inherit !important }',
  'stylesheet [ class "name" [ important (padding inherit) ] ]'
)

testCssToElm(
  'unknown values',
  '.name { color: a }',
  'stylesheet [ class "name" [ property "color" "a" ] ]'
)

testCssToElm(
  'unknown with quotes',
  '.name { quotes: "\\00ab" "\\00bb"; }',
  'stylesheet [ class "name" [ property "quotes" "\\"\\00ab\\" \\"\\00bb\\"" ] ]'
)
// TODO angles with transforms
// TODO hex color invalid length and invalid characters
// TODO rgb,rgba,hsl,hsla colors and invalid args
// TODO urls
// TODO integers https://developer.mozilla.org/en-US/docs/Web/CSS/integer
// TODO numbers https://developer.mozilla.org/en-US/docs/Web/CSS/number
// TODO unknown
