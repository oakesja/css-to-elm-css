import test from 'ava'
import cssToElm from '../../index'

exports.testCssToElm = function (description, css, expectedElm) {
  test(description, t => {
    return cssToElm(css).then(generated => {
      expectContentsEqual(t, generated, expectedElm)
    })
  })
}

exports.testCssToElmWithFormatting = function (description, css, expectedElm) {
  test(description, t => {
    return cssToElm(css).then(generated => {
      deepEqual(t, generated, expectedElm.trim())
    })
  })
}

export const deepEqual = (t, actual, expected) => {
  return t.deepEqual(actual, expected, `
    Actual:
    ${JSON.stringify(actual, null, 2).split('\n').join('\n    ')}

    Expected:
    ${JSON.stringify(expected, null, 2).split('\n').join('\n    ')}

  `)
}

function expectContentsEqual (t, value, expected) {
  var a = replaceExtraWhitespace(value)
  var e = replaceExtraWhitespace(expected)
  t.is(a, e)
}

function replaceExtraWhitespace (s) {
  return s.replace(/\s+/g, ' ')
}
