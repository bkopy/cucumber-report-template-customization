var webpack = require("webpack");

module.exports = {
	entry: [
		"./src/template_logic" //App entry point
	],

	output: {
		path: __dirname,
		filename: "app.js"
	},

	resolve: {
		modulesDirectories: [
			"node_modules"
		],
		extensions: ["", ".js"] //Extensions to process
	},

	plugins: [
		new webpack.ProvidePlugin({
			d3: "d3"
		})
	]
};