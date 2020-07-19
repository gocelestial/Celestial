import { src, dest, watch } from "gulp";
import path from "path";
const tsc = require("gulp-typescript");
const nodemon = require("gulp-nodemon");

const typescriptRoot = path.resolve(__dirname, "../src/**/*.ts");
const typescriptOut = path.resolve(__dirname, "../");

const typescript = () => {
	return src(typescriptRoot)
		.pipe(tsc(require("../tsconfig.js")))
		.pipe(dest(typescriptOut));
};

const server = () => {
	return nodemon({
		script: "index.js",
	});
};

const watcher = () => {
	return watch(typescriptRoot, typescript);
};

export { typescript, server, watcher };
