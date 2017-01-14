import test from 'ava'
import {cssToElmCss} from '../../index'

exports.testCssToElm = function (description, css, expectedElm) {
  test(description, t => {
    return cssToElmCss(css).then(generated => {
      expectContentsEqual(t, generated, expectedElm)
    })
  })
}

function expectContentsEqual (t, value, expected) {
  var a = replaceExtraWhitespace(value)
  var e = replaceExtraWhitespace(expected)
  t.is(a, e)
}

function replaceExtraWhitespace (s) {
  return s.replace(/\s+/g, ' ')
}
