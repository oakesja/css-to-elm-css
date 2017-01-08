var fs = require('fs');
var escapeStringRegexp = require('escape-string-regexp');
var jsCreator = require('./jsCreator');

fs.readFile('../elm-css/src/Css.elm', 'utf8', (err, file) => {
  if (err) throw err;
  var cssProps = createCssPropLookups(file);
  var generatedFile = '';
  generatedFile += jsCreator.createObject('singleArityPropsLookup', cssProps['singleArity']);
  generatedFile += '\n\n';
  generatedFile += jsCreator.createObject('multiArityPropsLookup', cssProps['multiArity']);
  generatedFile += '\n\n';
  generatedFile += jsCreator.createObject('propsTakeListsLookup', cssProps['listProps']);
  fs.writeFile('propLookups.js', generatedFile, function(err) {
    if (err)
      throw err;
  });
});

function createCssPropLookups(file) {
  var singleArity = {};
  var multiArity = {};
  var listProps = {};
  var allProps = createCssPropNameToFunctionNamesLookup(file);
  for (var key in allProps) {
    var functions = allProps[key];
    if (functions.length == 1) {
      singleArity[key] = functions[0];
    } else if (functions.length > 1 && functions.some(function(x) {return /^(\w+)\d$/.test(x)})) {
      multiArity[key] = {};
      for (var func of functions) {
        var arity = parseInt(func.charAt(func.length - 1)) || 1;
        multiArity[key][arity] = func;
      }
    } else if (functions.length == 2 && functions.every(function(x) {return /^(\w+)[^0-9]$/.test(x)})) {
      listProps[key] = {
        'single': functions[0],
        'list': functions[1]
      };
    } else {
      console.log("Failed to classify css property: " + key)
    }
  }
  return {
    'singleArity': singleArity,
    'multiArity': multiArity,
    'listProps': listProps
  }
}

function createCssPropNameToFunctionNamesLookup(file) {
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