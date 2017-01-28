import {testCssToElmWithFormatting} from './helpers/helpers'

testCssToElmWithFormatting(
  'line comment at the beginning of a file',
  `
/* some code comment */
.class {
  text-align: inherit;
}
  `,
  `
-- some code comment
stylesheet
    [ (.) "class"
        [ textAlign inherit
        ]
    ]
  `
)

testCssToElmWithFormatting(
  'multi-line comment at the beginning of a file',
  `
/* line 1
line 2
*/
.class {
  text-align: inherit;
}
  `,
  `
{-| line 1
line 2
-}
stylesheet
    [ (.) "class"
        [ textAlign inherit
        ]
    ]
  `
)

testCssToElmWithFormatting(
  'multiple comments at the beginning of a file',
  `
/* some code comment */
/*
comment 2
line 2
*/
.class {
  text-align: inherit;
}
  `,
  `
-- some code comment
{-|
comment 2
line 2
-}
stylesheet
    [ (.) "class"
        [ textAlign inherit
        ]
    ]
  `
)

testCssToElmWithFormatting(
  'line comment at the end of a file',
  `
.class {
  text-align: inherit;
}
/* some code comment */
  `,
  `
stylesheet
    [ (.) "class"
        [ textAlign inherit
        ]
    ]
-- some code comment
  `
)

testCssToElmWithFormatting(
  'multi-line comment at the end of a file',
  `
.class {
  text-align: inherit;
}
/* line 1
line 2
*/
  `,
  `
stylesheet
    [ (.) "class"
        [ textAlign inherit
        ]
    ]
{-| line 1
line 2
-}
  `
)

testCssToElmWithFormatting(
  'multiple comments at the end of a file',
  `
.class {
  text-align: inherit;
}
/* some code comment */
/*
comment 2
line 2
*/
  `,
  `
stylesheet
    [ (.) "class"
        [ textAlign inherit
        ]
    ]
-- some code comment
{-|
comment 2
line 2
-}
  `
)

testCssToElmWithFormatting(
  'line comment in the middle of rules',
  `
.class1 {}
/* comment */
.class2 {}

  `,
  `
stylesheet
    [ (.) "class1"
        [
        ]
    -- comment
    , (.) "class2"
        [
        ]
    ]
  `
)

// testCssToElmWithFormatting(
//   'line comment at the beginning of a rule',
//   `.class1 {/* comment */, padding: inherit}`,
//   `
// stylesheet
//     [ (.) "class1"
//         [ -- comment
//           padding inherit
//         ]
//     ]
//   `
// )

// TODO in the middle of values
// TODO in the middle of function values
