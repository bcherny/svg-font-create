SVG font creator
================

### How is this fork different from the original?

- Instead of relying on config.yml, we rely on package.json for metadata and the src directory for glyph names. This should be a more designer-friendly approach.
- Automatically convert polygons to paths
- Automatically convert multi-path SVGs to compound paths

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
require('./node_modules/svg-font-create/svg-font-create')({
	name: 'myFont',
	input_dir: './src',
	output_dir: './dist'
});
```

----------------------------

This tool creates an SVG font from separate images. Due simplified process,
images must be preliminary optimized with [SVGO](https://github.com/svg/svgo):

- scaled to required height
- all paths joined to single one
- no `fill` commands colors transforms and others
- `fill` defined by polyline direction (`cw` - black, `ccw` - white)

### License

View the [LICENSE](https://github.com/fontello/svg-font-create/blob/master/LICENSE) file
(MIT).