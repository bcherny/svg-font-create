_ = require 'lodash'
fs = require 'fs'
path = require 'path'

_.extend module.exports,

	loadTemplate: (file) ->
		_.template do (fs.readFileSync path.resolve __dirname, file).toString

	# generates a random hex code for cache busting
	hex: ->
		(Math.floor Math.random()*16777215).toString 16

	compoundPathFromPaths: (paths) ->

		_.map paths, (path) -> path.getAttribute 'd'
		.join ' '

	compoundPathFromPolygons: (points) ->

		"M #{
			_.map points, (path) -> path.getAttribute 'points'
			.join 'z M'
		}z"