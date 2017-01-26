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
  'line comment in the middle of the file',
  `
.class1 {}
/* comment */
.class2 {}

  `,
  `
stylesheet
    [ (.) "class"
         [
        ]
    -- comment
    , (.) "class"
         [
        ]
    ]
  `
)
