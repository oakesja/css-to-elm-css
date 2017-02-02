import {testCssToElm} from './helpers/helpers'

testCssToElm(
  'class selector',
  '.name { }',
  'stylesheet [ class "name" [ ] ]'
)

testCssToElm(
  'id selector',
  '#name { }',
  'stylesheet [ id "name" [ ] ]'
)

testCssToElm(
  'html element selector',
  'body { }',
  'stylesheet [ body [ ] ]'
)

testCssToElm(
  'unknown selector',
  '::-webkit-progress-bar { }',
  'stylesheet [ selector "::-webkit-progress-bar" [ ] ]'
)
