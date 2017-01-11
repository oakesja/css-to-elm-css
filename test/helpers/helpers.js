exports.expectContentsEqual = function (t, value, expected) {
  var a = replaceExtraWhitespace(value)
  var e = replaceExtraWhitespace(expected)
  t.is(a, e)
}

function replaceExtraWhitespace (s) {
  return s.replace(/\s+/g, ' ')
}
