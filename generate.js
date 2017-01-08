var fs = require('fs');
var escapeStringRegexp = require('escape-string-regexp');
var jsCreator = require('./jsCreator');

fs.readFile('../elm-css/src/Css.elm', 'utf8', (err, file) => {
  if (err) throw err;
  var generatedFile = '';
  generatedFile += jsCreator.createObject('singleArityPropsLookup', singleArityLookup(file));
  generatedFile += '\n\n';
  generatedFile += jsCreator.createObject('multiArityPropsLookup', multiArityLookup(file));
  generatedFile += '\n\n';
  generatedFile += jsCreator.createObject('propsTakeListsLookup', propsThatTakeListsLookup(file));
  fs.writeFile('propLookups.js', generatedFile, function(err) {
    if (err)
      throw err;
  });
});

function singleArityLookup(file) {
  var lookup = {};
  var allProps = cssPropertiesLookup(file);
  for (var key in allProps) {
    var functions = allProps[key];
    if (functions.length == 1)
      lookup[key] = functions[0];
  }
  return lookup;
}

function multiArityLookup(file) {
  var lookup = {};
  var allProps = cssPropertiesLookup(file);
  for (var key in allProps) {
    var functions = allProps[key];
    if (functions.length > 1 && functions.some(function(x) {return /^(\w+)\d$/.test(x)})) {
      lookup[key] = {};
      for (var func of functions) {
        var arity = parseInt(func.charAt(func.length - 1)) || 1;
        lookup[key][arity] = func;
      }
    }
  }
  return lookup;
}

function propsThatTakeListsLookup(file) {
  var lookup = {};
  var allProps = cssPropertiesLookup(file);
  for (var key in allProps) {
    var functions = allProps[key];
    if (functions.length == 2 && functions.every(function(x) {return /^(\w+)[^0-9]$/.test(x)})) {
      lookup[key] = {
        'single': functions[0],
        'list': functions[1]
      };
    }
  }
  return lookup;
}

function cssPropertiesLookup(file) {
  var props = {};
  for (var func of exposedFunctionNames(file)) {
    var propName = cssPropertyName(file, func);
    if (propName) {
      if(props[propName]) {
        props[propName].push(func);
      } else {
        props[propName] = [func];
      }
    }
  }
  return props;
}

function exposedFunctionNames(file) {
  return exposedNames(file).filter(isFunction.bind(undefined, file)).sort();
}

function exposedNames(file) {
  var regex = /exposing\s*\(((.|\n)*?) \)/
  var errorMsg = "Failed to find exposed functions";
  var result = execRegex(file, regex, errorMsg)
  return result[1].replace(/\s/g, '').split(',');
}

function isFunction(file, name) {
  return new RegExp('^' + escapeStringRegexp(name) + ' : ', 'm').test(file)
}

function isCssProperty(file, functionName) {
  return !!cssPropertyName(file, functionName);
}

function cssPropertyName(file, functionName) {
  var body = functionBody(file, functionName);
  var propMatch = /(?:prop1|prop2|prop3|prop4|prop5) "(\S+)"/.exec(body)
  var propWarnMatch = /\bpropertyWithWarnings\b (?:\S+) "(\S+)"/.exec(body)
  var propOverloadMatch = /\bgetOverloadedProperty\b (?:\S+) "(\S+)"/.exec(body)
  if (propMatch)
    return propMatch[1]
  if (propWarnMatch)
    return propWarnMatch[1]
  if (propOverloadMatch)
    return propOverloadMatch[1]
  return ''
}

function functionComment(file, functionName) {
  var name = escapeStringRegexp(reverseString(functionName));
  var regex = new RegExp(name + '\\n\\}-((.|\\n)*?)\\|-\\{');
  var errorMsg = "Failed find comment for function: " + functionName;
  return reverseString(execRegex(reverseString(file), regex, errorMsg)[1]);
}

function functionBody(file, functionName) {
  var name = escapeStringRegexp(functionName);
  var regex = new RegExp(name + ' : (?:.*)\n' + name + '(?:.*) =\s*((.|\n)*?)\n(\n|$)');
  var errorMsg = "Failed find body for function: " + functionName;
  return execRegex(file, regex, errorMsg)[1];
}

function reverseString(str) {
    return str.split("").reverse().join("");
}

function execRegex(str, regex, errorMsg) {
  var result = regex.exec(str)
  if (result)
    return result;
  throw errorMsg;
}