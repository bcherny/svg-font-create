#!/usr/bin/env node

var ArgumentParser = require('argparse').ArgumentParser;
var convert = require('./svg-font-create');

var parser = new ArgumentParser({
  version: require('./package.json').version,
  addHelp: true,
  description: 'Create SVG font from separate images'
});

parser.addArgument([ '-n', '--name' ], { help: 'Font name', required: true });
parser.addArgument([ '-i', '--input_dir' ], { help: 'Source images path (eg. "./src")', required: true });
parser.addArgument([ '-o', '--output_dir' ], { help: 'Output font file path (eg. "./dist")', required: true });
parser.addArgument([ '-s', '--svgo_config' ], { help: 'SVGO config path (use default if not set)' });

var args = parser.parseArgs();

if (args) {
  convert(args);
}