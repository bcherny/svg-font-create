#!/usr/bin/env node

'use strict';

// imports
var fs        = require('fs');
var path      = require('path');
var _         = require('lodash');
var DOMParser = require('xmldom').DOMParser;
var fstools   = require('fs-tools');
var execFile  = require('child_process').execFile;
var glob      = require('glob');
var execSync  = require('exec-sync');

// exports
module.exports = convert;

// config
var DEFAULT_CONFIG = {
  ascent: 850,
  descent: 150,
  weight: 'Normal'
};
var config = require(path.resolve('./package.json'));

function parseSvgImage(data, filename) {

  var doc = new DOMParser().parseFromString(data, 'application/xml'),
      svg = doc.getElementsByTagName('svg')[0];

  if (!svg.hasAttribute('height')) {
    throw new Error('Missed height attribute ' + (filename ? ' in ' + filename : ''));
  }
  if (!svg.hasAttribute('width')) {
    throw new Error('Missed width attribute ' + (filename ? ' in ' + filename : ''));
  }

      // Silly strip 'px' at the end, if exists
  var height = parseFloat(svg.getAttribute('height')),
      width = parseFloat(svg.getAttribute('width')),

      // get elements
      path = svg.getElementsByTagName('path'),
      polygon = svg.getElementsByTagName('polygon'),

      // element data
      transform = '',
      d = '';

  if (!path.length && !polygon.length) {
    throw new Error('No path or polygon data found' + (filename ? ' (' + filename + ')' : ''));
  }

  if (path.length) {

    d = compoundPathFromPaths(path);

  } else if (polygon.length) {

    d = pathDataFromPolygonPoints(compoundPathFromPolygons(polygon));
    path = polygon;

  }

  if (path[0].hasAttribute('transform')) {
    transform = path[0].getAttribute('transform');
  }

  return {
    height    : height,
    width     : width,
    d         : d,
    transform : transform
  };
}


var svgImageTemplate = loadTemplate('./templates/image.svg'),
    svgFontTemplate = loadTemplate('./templates/font.svg'),
    cssTemplate = loadTemplate('./templates/font.css'),
    sassTemplate = loadTemplate('./templates/font.scss'),
    htmlTemplate = loadTemplate('./templates/font.html');

////////////////////////////////////////////////////////////////////////////////

function convert (args) {

  if (args.name) {
    config.name = args.name;
  }

  var tmpDir = fstools.tmpdir();
  fstools.mkdirSync(tmpDir);

  var font = config.font || DEFAULT_CONFIG;
  // fix descent sign
  if (font.descent > 0) { font.descent = -font.descent; }

  var fontHeight = font.ascent - font.descent;

  console.log('Transforming coordinates');

  //
  // Recalculate coordinates from image to font
  //
  fstools.walkSync(args.input_dir, /[.]svg$/i, function (file) {
    var transform = '', scale, svgOut;
    var glyph = parseSvgImage(fs.readFileSync(file, 'utf8'), file);

    scale = fontHeight / glyph.height;

    // descent shift
    transform += 'translate(0 ' + font.descent + ')';

    // scale
    transform += ' scale(' + scale + ')';

    // vertical mirror
    transform += ' scale(1, -1)';

    svgOut = svgImageTemplate({
      height : glyph.height,
      width  : glyph.width,
      d      : glyph.d,
      transform : glyph.transform ? transform + ' ' + glyph.transform : transform
    });

    fs.writeFileSync(path.join(tmpDir, path.basename(file)), svgOut, 'utf8');
  });

  console.log('Optimizing images');

  var svgoConfig = args.svgo_config ? path.resolve(args.svgo_config) : path.resolve(__dirname, 'svgo.yml');

  execFile(
    path.resolve(__dirname, './node_modules/.bin/svgo'),
    [ '-f', tmpDir, '--config', svgoConfig ],
    function (err) {

    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log('Generating glyphs');

    var rgxUnicode = /([a-f][a-f\d]{3,4})/i,
        rgxName = /-(.+).svg/,
        rgxAcronym = /\b([\w\d])/ig,
        glyphs = [];

    glob.sync(args.input_dir + '/*.svg').forEach(function (file) {

      var unicode = file.match(rgxUnicode),
          name = file.match(rgxName);

      if (!unicode[0]) {
        throw new Error ('Expected "' + file + '" to be in the format "xxxx-icon-name.svg"');
      }

      var svg = parseSvgImage(fs.readFileSync(path.resolve(tmpDir, path.basename(file)), 'utf8'), file);

      glyphs.push({
        css: path.basename(name[0] || unicode[0], '.svg').replace(/-/g, ' ').trim(),
        unicode: '&#x' + unicode[0] + ';',
        width: svg.width,
        d: svg.d
      });

    });

    var opts = {
      font : font,
      glyphs : glyphs,
      metadata : 'Copyright (c) ' + new Date().getFullYear() + ' Turn Inc.',
      fontHeight : font.ascent - font.descent,
      fontFamily : config.name,
      prefix: args.prefix || config.name.match(rgxAcronym).join(''),
      hex: hex()
    };

    var svgOut = svgFontTemplate(opts),
        svg = args.output_dir + '/' + config.name + '.svg',
        ttf = args.output_dir + '/' + config.name + '.ttf',
        woff = args.output_dir + '/' + config.name + '.woff',
        eot = args.output_dir + '/' + config.name + '.eot';

    console.log('Generating SVG');
    fs.writeFileSync(svg, svgOut, 'utf8');

    console.log('Generating TTF');
    execSync(path.resolve(__dirname, './node_modules/.bin/svg2ttf ' + svg + ' ' + ttf));

    console.log('Generating WOFF');
    execSync(path.resolve(__dirname, './node_modules/.bin/ttf2woff ' + ttf + ' ' + woff));

    console.log('Generating EOT');
    execSync(path.resolve(__dirname, './node_modules/.bin/ttf2eot ' + ttf + ' ' + eot));

    console.log('Generating CSS');
    fs.writeFileSync('./dist/font.css', cssTemplate(opts), 'utf8');

    console.log('Generating SASS');
    fs.writeFileSync('./dist/font.scss', sassTemplate(opts), 'utf8');

    console.log('Generating HTML spec');
    fs.writeFileSync('./dist/font.html', htmlTemplate(opts), 'utf8');

    fstools.removeSync(tmpDir);

    console.log('Done!');

  });

};

// helpers

function loadTemplate (file) {
  return _.template(fs.readFileSync(path.resolve(__dirname, file)).toString());
}

/* generates a random hex code */
function hex () {
  return Math.floor(Math.random()*16777215).toString(16);
}

function pathDataFromPolygonPoints (points) {

  return points
    .split(/\s+/)
    .map(function (p, i) {
      return (i && 'L' || 'M') + p;
    })
    .join('');

}

function compoundPathFromPaths (paths) {

  return _.map(paths, function (path) {
      return path.getAttribute('d');
    })
    .join(' ');

}

function compoundPathFromPolygons (points) {

  return 'M' + _.map(points, function (path) {
      return path.getAttribute('points');
    })
    .join('z M') + 'z';

}