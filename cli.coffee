ArgumentParser = (require 'argparse').ArgumentParser
create = require './svg-font-create'

parser = new ArgumentParser
  version: (require './package.json').version
  addHelp: true
  description: 'Create SVG font from separate images'

parser.addArgument [ '-n', '--name' ],
	help: 'Font name'

parser.addArgument [ '-i', '--input_dir' ],
	help: 'Source images path (eg. "./src")'
	required: true

parser.addArgument [ '-o', '--output_dir' ],
	help: 'Output font file path (eg. "./dist")'
	required: true

parser.addArgument [ '-s', '--svgo_config' ],
	help: 'SVGO config path (use default if not set)'
	
parser.addArgument [ '-p', '--prefix' ],
	help: 'Prefix for CSS classes'

args = do parser.parseArgs
create args if args