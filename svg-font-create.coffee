# imports
fs = require 'fs'
path = require 'path'
_ = require 'lodash'
DOMParser = (require 'xmldom').DOMParser
glob = require 'glob'
execSync = require 'exec-sync'
SvgPath = require 'svgpath'
util = require './util'
defaults = require './defaults.json'
config = require path.resolve './package.json'

# templates
svgTemplate = util.loadTemplate './templates/font.svg'
cssTemplate = util.loadTemplate './templates/font.css'
sassTemplate = util.loadTemplate './templates/_font.scss'
htmlTemplate = util.loadTemplate './templates/font.html'

# regexes
rgxUnicode = /([a-f][a-f\d]{3,4})/i
rgxName = /-(.+).svg/
rgxAcronym = /\b([\w\d])/ig

parse = (data, filename) ->

	doc = (new DOMParser).parseFromString data, 'application/xml'
	svg = _.first doc.getElementsByTagName 'svg'
	height = parseFloat svg.getAttribute 'height'
	width = parseFloat svg.getAttribute 'width'

	# check for width and height
	if isNaN height
		throw new Error "Missing height attribute in #{filename}"
	if isNaN width
		throw new Error "Missing width attribute in #{filename}"

	# get elements
	paths = svg.getElementsByTagName 'path'
	polygons = svg.getElementsByTagName 'polygon'

	# check for paths/polygons
	if not paths.length and not polygons.length
		throw new Error "No path or polygon data found in #{filename}"

	return {
		height: height
		width: width
		d: "#{util.compoundPathFromPaths paths} #{util.compoundPathFromPolygons polygons}"
	}

generate = (data) ->

	svg = "#{data.font.output_dir }/#{config.name}.svg"
	ttf = "#{data.font.output_dir}/#{config.name}.ttf"

	_.forEach
		'Generating SVG': -> fs.writeFileSync svg, (svgTemplate data), 'utf8'
		'Generating TTF': -> execSync path.resolve __dirname, "./node_modules/.bin/svg2ttf #{svg} #{ttf}"
		'Generating WOFF': -> execSync path.resolve __dirname, "./node_modules/.bin/ttf2woff #{ttf} #{data.font.output_dir}/#{config.name}.woff"
		'Generating EOT': -> execSync path.resolve __dirname, "./node_modules/.bin/ttf2eot #{ttf} #{data.font.output_dir}/#{config.name}.eot"
		'Generating CSS': -> fs.writeFileSync './dist/font.css', (cssTemplate data), 'utf8'
		'Generating SASS': -> fs.writeFileSync './dist/_font.scss', (sassTemplate data), 'utf8'
		'Generating HTML spec': -> fs.writeFileSync './dist/font.html', (htmlTemplate data), 'utf8'
		'Done!': ->
	, (fn, message) ->
		console.log message
		do fn

convert = (args) ->

	# set options (extend defaults.json with package.json#font with CLI args)
	options = _.extend defaults, config.font, args

	# template data
	data =
		font: options
		glyphs: []
		fontHeight: options.ascent - options.descent
		fontFamily: config.name
		prefix: args.prefix or (config.name.match rgxAcronym).join ''
		hex: do util.hex

	console.log 'Scaling images'

	# Generate normalized glyphs
	glob
	.sync "#{args.input_dir}/*.svg"
	.forEach (file) ->

		# get unicode and glyph name from file name
		name = _.first file.match rgxName
		unicode = _.first file.match rgxUnicode

		# check for unicode
		if not unicode?
			throw new Error "Expected #{file} to be in the format 'xxxx-icon-name.svg'"
		
		# normalize glyph
		glyph = parse (fs.readFileSync file, 'utf8'), file
		ratio = data.fontHeight/glyph.height

		data.glyphs.push
			css: do ((path.basename name or unicode, '.svg').replace /-/g, ' ').trim
			unicode: "&#x#{unicode};"
			width: glyph.width
			d: do new SvgPath glyph.d
			.scale ratio, -ratio
			.toString

	generate data

# exports
module.exports = convert