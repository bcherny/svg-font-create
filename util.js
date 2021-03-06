// Generated by CoffeeScript 1.7.1
var fs, path, _;

_ = require('lodash');

fs = require('fs');

path = require('path');

_.extend(module.exports, {
  loadTemplate: function(file) {
    return _.template((fs.readFileSync(path.resolve(__dirname, file))).toString());
  },
  hex: function() {
    return (Math.floor(Math.random() * 16777215)).toString(16);
  },
  compoundPathFromPaths: function(paths) {
    return _.map(paths, function(path) {
      return path.getAttribute('d');
    }).join(' ');
  },
  compoundPathFromPolygons: function(points) {
    return "M " + (_.map(points, function(path) {
      return path.getAttribute('points');
    }).join('z M')) + "z";
  }
});
