import {testCssToElm} from './helpers/helpers'

testCssToElm(
  'single arity property functions',
  '.class { text-align: inherit; }',
  'stylesheet [ (.) "class" [ textAlign inherit ] ]'
)

testCssToElm(
  'multi arity property functions',
  '.class { padding: inherit inherit; }',
  'stylesheet [ (.) "class" [ padding2 inherit inherit ] ]'
)
