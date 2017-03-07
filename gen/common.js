import fs from 'fs'

export function execRegex (str, regex, errorMsg) {
  const result = regex.exec(str)
  if (result) { return result }
  throw errorMsg
}
