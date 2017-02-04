import fs from 'fs'
import ElmCssFileParser from './elmCssFileParser'

export function reverseString (str) {
  return str.split('').reverse().join('')
}

export function execRegex (str, regex, errorMsg) {
  const result = regex.exec(str)
  if (result) { return result }
  throw errorMsg
}

export function createCssFileParser (filePath) {
  return new ElmCssFileParser(readFile(filePath))
}

export function createElmFileParser (filePath) {
  return new ElmCssFileParser(readFile(filePath))
}

function readFile (filePath) {
  return fs.readFileSync(filePath, 'utf8')
}
