import {testCssToElmWithFormatting} from './helpers/helpers'

testCssToElmWithFormatting(
  'multiple css declarations',
  '.class { text-align: inherit; color: inherit; }',
  `
stylesheet
    [ class "class"
        [ textAlign inherit
        , color inherit
        ]
    ]
  `
)

testCssToElmWithFormatting(
  'multiple css rules',
  '.class { text-align: inherit; color: inherit; } .other { padding: inherit; width: inherit; }',
  `
stylesheet
    [ class "class"
        [ textAlign inherit
        , color inherit
        ]
    , class "other"
        [ padding inherit
        , width inherit
        ]
    ]
  `)

testCssToElmWithFormatting(
  'no css rules',
  '',
  ''
)

testCssToElmWithFormatting(
  'no css declarations for a rule',
  '.class {}',
  `
stylesheet
    [ class "class"
        [
        ]
    ]
  `)

