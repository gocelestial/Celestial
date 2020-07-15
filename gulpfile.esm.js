import { src, dest, watch, series, parallel } from "gulp";
import path from "path";
const tsc = require("gulp-typescript");
const nodemon = require("gulp-nodemon");

const typescriptRoot = path.resolve(__dirname, "./src/**/*.ts");
const typescriptOut = path.resolve(__dirname, "./");

// Tasks
const typescript = () => {
	return src(typescriptRoot).pipe(tsc()).pipe(dest(typescriptOut));
};

const server = () => {
	return nodemon({
		script: "index.js",
	});
};

const watcher = () => {
	return watch(typescriptRoot, typescript);
};

// Env tasks
const development = series(typescript, parallel(server, watcher));
const production = series(typescript, server);

export { development, production };
