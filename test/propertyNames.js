import {testCssToElm} from './helpers/helpers'

testCssToElm(
  'single arity property functions',
  '.class { text-align: inherit; }',
  'stylesheet [ class "class" [ textAlign inherit ] ]'
)

testCssToElm(
  'multi arity property functions',
  '.class { padding: inherit inherit; }',
  'stylesheet [ class "class" [ padding2 inherit inherit ] ]'
)

testCssToElm(
  'unknown properties',
  '.class { -webkit-transform: translate(100px); }',
  'stylesheet [ class "class" [ property "-webkit-transform" "translate(100px)" ] ]'
)

testCssToElm(
  'display: flex',
  '.class { display: flex; }',
  'stylesheet [ class "class" [ displayFlex ] ]'
)

testCssToElm(
  'single param for property that can take a list',
  '.class { text-decoration-line: underline; }',
  'stylesheet [ class "class" [ textDecorationLine underline ] ]'
)

testCssToElm(
  'multiple params for property that can take a list',
  '.class { text-decoration-line: underline overline; }',
  'stylesheet [ class "class" [ textDecorationLines [ underline, overline ] ] ]'
)
