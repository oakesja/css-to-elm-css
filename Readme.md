Goal:

Generate compilable elm-css code from valid css. In cases that elm-css does not have support for something:
  - fall back to using custom functions like `selector` or `property` when able
  - skip entirely (like at-rules) and warn 

Things to support:

- [ ] property names

  - [x] single arity (color, display, etc.)
  - [x] multiple arities (padding, flex, etc.)
  - [x] can take lists as args (font-family, etc.)
  - [x] displayFlex

- [ ] values
    - [x] lengths (px, in, etc)
    - [ ] angles (deg, rad, etc)
    - [ ] transforms (rotate, scale, etc. )
    - [ ] color values (rgb, hsl)
    - [ ] length calculations (|+|, |/|, etc) http://www.w3schools.com/cssref/func_calc.asp
    - [ ] integers and floats
    - [ ] TextAlign
    - [ ] VerticalAlign
    - [ ] feature tags https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings
    - [x] values with arity 0

- [ ] selectors

  - [x] class
  - [x] id
  - [x] html elements
  - [ ] combinators <https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_selectors>
  - [ ] attribute selectors <https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors>
  - [ ] universal selectors <https://developer.mozilla.org/en-US/docs/Web/CSS/Universal_selectors>
  - [ ] pseudo classes <https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes>

- [ ] media queries

- [x] important

- [ ] code comments

- [x] at-rules (only @keyframes) not currently supported by elm-css

- [ ] validation?

- [ ] use other postcss plugins

- [ ] use other postcss parsers
