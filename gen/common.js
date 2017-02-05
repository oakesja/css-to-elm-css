import fs from 'fs'

export function reverseString (str) {
  return str.split('').reverse().join('')
}

export function execRegex (str, regex, errorMsg) {
  const result = regex.exec(str)
  if (result) { return result }
  throw errorMsg
}
