// Generated by CoffeeScript 1.7.1
var DEFAULT_CONFIG, DOMParser, SvgPath, config, convert, cssTemplate, execSync, fs, glob, htmlTemplate, parseSvgImage, path, rgxAcronym, rgxFiles, rgxName, rgxUnicode, sassTemplate, svgFontTemplate, svgImageTemplate, util, _;

fs = require('fs');

path = require('path');

_ = require('lodash');

DOMParser = (require('xmldom')).DOMParser;

glob = require('glob');

execSync = require('exec-sync');

SvgPath = require('svgpath');

util = require('./util');

DEFAULT_CONFIG = {
  ascent: 850,
  descent: 150,
  weight: 'Normal'
};

config = require(path.resolve('./package.json'));

svgImageTemplate = util.loadTemplate('./templates/image.svg');

svgFontTemplate = util.loadTemplate('./templates/font.svg');

cssTemplate = util.loadTemplate('./templates/font.css');

sassTemplate = util.loadTemplate('./templates/font.scss');

htmlTemplate = util.loadTemplate('./templates/font.html');

rgxUnicode = /([a-f][a-f\d]{3,4})/i;

rgxName = /-(.+).svg/;

rgxAcronym = /\b([\w\d])/ig;

rgxFiles = /[.]svg$/i;

parseSvgImage = function(data, filename) {
  var d, doc, height, paths, polygons, svg, width;
  doc = (new DOMParser).parseFromString(data, 'application/xml');
  svg = _.first(doc.getElementsByTagName('svg'));
  if (!svg.hasAttribute('height')) {
    throw new Error("Missed height attribute in " + filename);
  }
  if (!svg.hasAttribute('width')) {
    throw new Error("Missed width attribute in " + filename);
  }
  height = parseFloat(svg.getAttribute('height'));
  width = parseFloat(svg.getAttribute('width'));
  paths = svg.getElementsByTagName('path');
  polygons = svg.getElementsByTagName('polygon');
  if (!paths.length && !polygons.length) {
    throw new Error("No path or polygon data found in " + filename);
  }
  if (paths.length) {
    d = util.compoundPathFromPaths(paths);
  } else {
    d = util.compoundPathFromPolygons(polygons);
    paths = polygons;
  }
  return {
    height: height,
    width: width,
    d: d,
    transform: paths[0].getAttribute('transform')
  };
};

convert = function(args) {
  var eot, font, fontHeight, glyphs, opts, svg, ttf, woff;
  if (args.name != null) {
    config.name = args.name;
  }
  font = config.font || DEFAULT_CONFIG;
  if (font.descent > 0) {
    font.descent = -font.descent;
  }
  fontHeight = font.ascent - font.descent;
  glyphs = [];
  console.log('Scaling images');
  (glob.sync("" + args.input_dir + "/*.svg")).forEach(function(file) {
    var glyph, name, scale, unicode;
    glyph = parseSvgImage(fs.readFileSync(file, 'utf8'), file);
    scale = fontHeight / glyph.height;
    glyph.d = (new SvgPath(glyph.d).scale(scale).scale(1, -1).toString)();
    unicode = file.match(rgxUnicode);
    name = file.match(rgxName);
    if (unicode[0] == null) {
      throw new Error("Expected " + file + " to be in the format 'xxxx-icon-name.svg'");
    }
    return glyphs.push({
      css: ((path.basename(name[0] || unicode[0], '.svg')).replace(/-/g, ' ')).trim(),
      unicode: "&#x" + unicode[0] + ";",
      width: glyph.width,
      d: glyph.d
    });
  });
  opts = {
    font: font,
    glyphs: glyphs,
    metadata: "Copyright (c) " + ((new Date).getFullYear()) + " Turn Inc.",
    fontHeight: font.ascent - font.descent,
    fontFamily: config.name,
    prefix: args.prefix || (config.name.match(rgxAcronym)).join(''),
    hex: util.hex()
  };
  svg = "" + args.output_dir + "/" + config.name + ".svg";
  ttf = "" + args.output_dir + "/" + config.name + ".ttf";
  woff = "" + args.output_dir + "/" + config.name + ".woff";
  eot = "" + args.output_dir + "/" + config.name + ".eot";
  return _.forEach({
    'Generating SVG': function() {
      return fs.writeFileSync(svg, svgFontTemplate(opts), 'utf8');
    },
    'Generating TTF': function() {
      return execSync(path.resolve(__dirname, "./node_modules/.bin/svg2ttf " + svg + " " + ttf));
    },
    'Generating WOFF': function() {
      return execSync(path.resolve(__dirname, "./node_modules/.bin/ttf2woff " + ttf + " " + woff));
    },
    'Generating EOT': function() {
      return execSync(path.resolve(__dirname, "./node_modules/.bin/ttf2eot " + ttf + " " + eot));
    },
    'Generating CSS': function() {
      return fs.writeFileSync('./dist/font.css', cssTemplate(opts), 'utf8');
    },
    'Generating SASS': function() {
      return fs.writeFileSync('./dist/font.scss', sassTemplate(opts), 'utf8');
    },
    'Generating HTML spec': function() {
      return fs.writeFileSync('./dist/font.html', htmlTemplate(opts), 'utf8');
    },
    'Done!': function() {}
  }, function(fn, message) {
    console.log(message);
    return fn();
  });
};

module.exports = convert;
