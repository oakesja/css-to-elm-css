import {testCssToElm} from './helpers/helpers'

testCssToElm(
  'class selector',
  '.name { }',
  'stylesheet [ (.) "name" [ ] ]'
)

testCssToElm(
  'id selector',
  '#name { }',
  'stylesheet [ (#) "name" [ ] ]'
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
