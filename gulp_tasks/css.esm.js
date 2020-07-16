// Gulp
import { src, dest, watch, series } from "gulp";

// PostCSS
import postcss from "gulp-postcss";
import cssImport from "postcss-import";
// import tailwindcss from "tailwindcss";
// import cssNesting from "postcss-nesting";
import autoprefixer from "autoprefixer";
// import purgecss from "@fullhuman/postcss-purgecss";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";

function css() {
	const plugins = [
		cssImport,
		postcssPresetEnv({
			/* stage 2 (default) + custom media queries */
			stage: 2,
			features: { "custom-media-queries": true, "nesting-rules": true },
		}),
		autoprefixer,
	];

	return src("src/assets/css/style.css")
		.pipe(postcss(plugins))
		.pipe(dest("assets/css"));
}

function cssPurgeMin() {
	const purge = purgecss({
		// Specify the paths to all of the template files in your project
		content: [
			"includes/**/*.liquid",
			"templates/**/*.liquid",
			"views/**/*.liquid",
		],

		whitelist: ["hidden"],

		// Include any special characters you're using in this regular expression
		defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
	});

	const plugins = [purge, cssnano];

	return src("assets/css/style.css")
		.pipe(postcss(plugins))
		.pipe(dest("assets/css"));
}

function cssWatcher() {
	return watch(["src/assets/css/**/*.css"], series(css));
}

export { css, cssWatcher, cssPurgeMin };
