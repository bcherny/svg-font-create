# imports
fs = require 'fs'
path = require 'path'
_ = require 'lodash'
DOMParser = (require 'xmldom').DOMParser
glob = require 'glob'
execSync = require 'exec-sync'
SvgPath = require 'svgpath'
util = require './util'
config = require path.resolve './package.json'

# config
DEFAULT_CONFIG =
	ascent: 850
	descent: 150
	weight: 'Normal'

# templates
svgTemplate = util.loadTemplate './templates/font.svg'
cssTemplate = util.loadTemplate './templates/font.css'
sassTemplate = util.loadTemplate './templates/font.scss'
htmlTemplate = util.loadTemplate './templates/font.html'

# regexes
rgxUnicode = /([a-f][a-f\d]{3,4})/i
rgxName = /-(.+).svg/
rgxAcronym = /\b([\w\d])/ig

parseSvgImage = (data, filename) ->

	doc = (new DOMParser).parseFromString data, 'application/xml'
	svg = _.first doc.getElementsByTagName 'svg'

	if not svg.hasAttribute 'height'
		throw new Error "Missed height attribute in #{filename}"
	
	if not svg.hasAttribute 'width'
		throw new Error "Missed width attribute in #{filename}"

	# get elements
	paths = svg.getElementsByTagName 'path'
	polygons = svg.getElementsByTagName 'polygon'

	if not paths.length and not polygons.length
		throw new Error "No path or polygon data found in #{filename}"

	if paths.length
		d = util.compoundPathFromPaths paths

	else
		d = util.compoundPathFromPolygons polygons
		paths = polygons

	return {
		height: parseFloat svg.getAttribute 'height'
		width: parseFloat svg.getAttribute 'width'
		d: d
		transform: paths[0].getAttribute 'transform'
	}

convert = (args) ->

	if args.name?
		config.name = args.name

	font = config.font or DEFAULT_CONFIG
	
	# fix descent sign
	if font.descent > 0
		font.descent = -font.descent

	fontHeight = font.ascent - font.descent
	glyphs = []

	console.log 'Scaling images'

	# Recalculate coordinates from image to font
	glob
	.sync "#{args.input_dir}/*.svg"
	.forEach (file) ->
		
		glyph = parseSvgImage (fs.readFileSync file, 'utf8'), file
		unicode = file.match rgxUnicode
		name = file.match rgxName
		d = do new SvgPath glyph.d
		.scale fontHeight/glyph.height
		.scale 1, -1
		.toString

		if not unicode[0]?
			throw new Error "Expected #{file} to be in the format 'xxxx-icon-name.svg'"

		glyphs.push
			css: do ((path.basename name[0] or unicode[0], '.svg').replace /-/g, ' ').trim
			unicode: "&#x#{unicode[0]};"
			width: glyph.width
			d: d

	opts =
		font: font
		glyphs: glyphs
		metadata: "Copyright (c) #{do (new Date).getFullYear} Turn Inc."
		fontHeight: font.ascent - font.descent
		fontFamily: config.name
		prefix: args.prefix or (config.name.match rgxAcronym).join ''
		hex: do util.hex

	svg = "#{args.output_dir }/#{config.name}.svg"
	ttf = "#{args.output_dir}/#{config.name}.ttf"

	_.forEach
		'Generating SVG': -> fs.writeFileSync svg, (svgTemplate opts), 'utf8'
		'Generating TTF': -> execSync path.resolve __dirname, "./node_modules/.bin/svg2ttf #{svg} #{ttf}"
		'Generating WOFF': -> execSync path.resolve __dirname, "./node_modules/.bin/ttf2woff #{ttf} #{args.output_dir}/#{config.name}.woff"
		'Generating EOT': -> execSync path.resolve __dirname, "./node_modules/.bin/ttf2eot #{ttf} #{args.output_dir}/#{config.name}.eot"
		'Generating CSS': -> fs.writeFileSync './dist/font.css', (cssTemplate opts), 'utf8'
		'Generating SASS': -> fs.writeFileSync './dist/font.scss', (sassTemplate opts), 'utf8'
		'Generating HTML spec': -> fs.writeFileSync './dist/font.html', (htmlTemplate opts), 'utf8'
		'Done!': ->
	, (fn, message) ->
		console.log message
		do fn

# exports
module.exports = convert