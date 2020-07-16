import { series, parallel } from "gulp";

// Tasks
import { css, cssPurgeMin, cssWatcher } from "./gulp_tasks/css.esm";
import { js, jsWatcher } from "./gulp_tasks/js.esm";
import { typescript, server, watcher } from "./gulp_tasks/express.esm";

// Frontend Tasks

// Env tasks
const development = series(
	typescript,
	parallel(js, css),
	parallel(jsWatcher, server, watcher, cssWatcher)
);
const production = series(
	typescript,
	parallel(js, series(css, cssPurgeMin), server)
);

export { development, production };
