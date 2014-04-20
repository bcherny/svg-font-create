SVG font creator
================

### How is this fork different from the original?

- Instead of relying on config.yml, we rely on package.json for metadata and the src directory for glyph names. This should be a more designer-friendly approach.
- Automatically convert polygons to paths
- Automatically convert multi-path SVGs to compound paths
- Generate several font formats (SVG, TTF, WOFF, EOT)
- Generate a font spec file (font.html)
- Generate CSS and SASS files
- Support prefixes for CSS classes, defaulting to the acronymized font name (eg. "my-font-2" would become "mf2-...")
- Remove support for SVGO, eliminate unnecessary filesystem i/o

### How do I use this?

1. Install NodeJS and NPM ([instructions](http://nodejs.org/download/)) on your computer
2. Create a new folder for your font (eg. myFont/)
3. Open that folder in your command line, and initialize a new NPM module with `npm init`
4. Install SVG Font Creator by running `npm install --save git://github.com/turn/svg-font-create.git`
5. Put your SVG icons in a folder (eg. myFont/src/)
6. Name each icon with a unicode character, and optionally a dash-separated name (eg. myFont/src/e601-star.svg, myFont/src/e602.svg, ...)
7. Generate your font with `./node_modules/svg-font-create/cli.js --input [inputFolder] --output [outputFolder] --name [fontName]` (eg. `./node_modules/svg-font-create/cli.js --input ./src --output ./dist --name turniconfont`)
8. That's it! Your generated font files will appear in your output folder

### Advanced usage

svg-font-create can be summoned through the CLI, or with a node script:

```js
require('svg-font-create')({
	prefix: 'mf',			// for CSS classes, eg. ".mf-favorite"
	input_dir: './src',		// where your SVG source files are
	output_dir: './dist'	// where you want the generated font to go
});
```

### Options

| cli flag			| programmatic usage					| description										|
|-------------------|---------------------------------------|---------------------------------------------------|
| `--name`			| `name: "foo"`							| Font name, defaults to name field in package.json	|
| `--input-dir`		| `input_dir: "./src"`					| Source images path								|
| `--output_dir`	| `output_dir: "./dist"`				| Output font file path								|
| `--prefix`		| `prefix: "foo"`						| Prefix for CSS classes							|

### License

View the [LICENSE](https://github.com/fontello/svg-font-create/blob/master/LICENSE) file
(MIT).