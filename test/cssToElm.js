import {testCssToElmWithFormatting} from './helpers/helpers'

testCssToElmWithFormatting(
  'multiple css values',
  '.class { text-align: inherit; color: inherit; }',
  `
stylesheet
    [ (.) "class"
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
    [ (.) "class"
        [ textAlign inherit
        , color inherit
        ]
    , (.) "other"
        [ padding inherit
        , width inherit
        ]
    ]
  `)
