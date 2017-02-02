import test from 'ava'
import {execFileSync} from 'child_process'
import fs from 'fs'

test.beforeEach(t => {
  t.context.convertedOutput = 'test/fixtures/ExampleCss.elm'
})

test.afterEach.always(t => {
  // if (fs.existsSync(t.context.convertedOutput)) {
  //   fs.unlinkSync(t.context.convertedOutput)
  // }
})

test('convert a css file into an elm file', t => {
  convertCssFile(t.context.convertedOutput)
  t.is(fs.existsSync(t.context.convertedOutput), true)
})

test('the converted elm file is compilable', t => {
  convertCssFile(t.context.convertedOutput)
  execFileSync('elm-css', ['Stylesheets.elm'], { cwd: './test/fixtures' })
  t.is(fs.existsSync(t.context.convertedOutput), true)
})

function convertCssFile (name) {
  execFileSync('bin/css-to-elm', ['test/fixtures/example.css', '-o', name])
}
