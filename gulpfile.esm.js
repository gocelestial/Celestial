import { series, parallel } from "gulp";

// Tasks
import { css, cssPurgeMin, cssWatcher } from "./gulp_tasks/css.esm";
import { js, jsWatcher } from "./gulp_tasks/js.esm";
import { minifyImg as img, imgWatcher } from "./gulp_tasks/img.esm";
import { typescript, server, watcher } from "./gulp_tasks/express.esm";

// Env tasks
const development = series(
	typescript,
	parallel(js, css, img),
	parallel(jsWatcher, server, watcher, cssWatcher, imgWatcher)
);
const production = series(
	typescript,
	parallel(js, img, series(css, cssPurgeMin), server)
);

export { development, production };
