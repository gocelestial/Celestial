// const rollup = require("rollup");
// import babel from "@rollup/plugin-babel";
// import resolve from "@rollup/plugin-node-resolve";
// import commonjs from "@rollup/plugin-commonjs";

// TODO DRY config
// const rollupConfig = {};

// const js = () =>
// 	rollup
// 		.rollup({
// 			input: "./src/assets/js/main.js",
// 			plugins: [
// 				resolve({
// 					browser: true,
// 					extensions: [".js", ".jsx"],
// 				}),
// 				commonjs(),
// 				babel({
// 					babelrc: false,
// 					babelHelpers: "bundled",
// 					presets: ["@babel/preset-env", "@babel/preset-react"],
// 					exclude: "node_modules/**",
// 				}),
// 			],
// 		})
// 		.then((bundle) => {
// 			return bundle.write({
// 				file: "./assets/js/main.js",
// 				format: "umd",
// 				sourcemap: true,
// 				name: "main",
// 			});
// 		});

// const jsWatcher = () => {
// 	const watcher = rollup.watch({
// 		input: "./src/assets/js/main.js",
// 		output: {
// 			format: "umd",
// 			file: "./assets/js/main.js",
// 			sourcemap: true,
// 			name: "main",
// 		},
// 		plugins: [
// 			resolve({
// 				extensions: [".js", ".jsx"],
// 			}),
// 			commonjs({
// 				extensions: [".js", ".jsx"],
// 				transformMixedEsModules: true,
// 			}),
// 			babel({
// 				babelrc: false,
// 				babelHelpers: "bundled",
// 				presets: ["@babel/preset-env", "@babel/preset-react"],
// 				exclude: "node_modules/**",
// 			}),
// 		],
// 	});

// 	watcher.on("event", (event) => {
// 		let msg;
// 		switch (event.code) {
// 			case "START":
// 				msg = "Rollup watcher (re)starting.";
// 			case "ERROR":
// 				msg = "Rollup (re)build error.";
// 			case "BUNDLE_START":
// 				msg = "Rollup bundle (re)build starting.";
// 			case "BUNDLE_END":
// 				msg = `Rollup bundle (re)build finished in ${event.duration}ms.`;
// 			case "END":
// 				msg = "Rollup (re)build finished.";
// 		}

// 		console.log(msg);
// 	});

// 	return watcher;
// };

import { src, dest, watch } from "gulp";
const compiler = require("webpack");
const webpack = require("webpack-stream");

const js = () => {
	return src("./src/assets/js/main.js")
		.pipe(
			webpack(require("../webpack.config.js"), compiler, (err, stat) => {
				if (err) console.log(err);
				else if (stat.warnings && stat.warnings.length)
					console.log(stat.warnings);
				else if (stat.errors && stat.errors.length)
					console.log(stat.errors);
				else
					console.log(
						`[${new Date(stat.endTime)}]: JS bundle built.`
					);
			})
		)
		.pipe(dest("./assets/js/"));
};

const jsWatcher = () => {
	return watch("./src/assets/js/**/*.{js,jsx}", js);
};

export { js, jsWatcher };
