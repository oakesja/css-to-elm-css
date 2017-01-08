exports.createObject = function(name, object, writeValues) {
  return 'var ' + name + ' = ' + JSON.stringify(object, null, '  ') + ';';
}