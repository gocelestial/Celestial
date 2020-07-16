const rollup = require("rollup");

const js = () =>
	rollup
		.rollup({
			input: "./src/assets/js/main.js",
			plugins: [],
		})
		.then((bundle) => {
			return bundle.write({
				file: "./assets/js/main.js",
				format: "umd",
				sourcemap: true,
			});
		});

const jsWatcher = () => {
	const watcher = rollup.watch({
		input: "./src/assets/js/main.js",
		output: {
			format: "umd",
			file: "./assets/js/main.js",
			sourcemap: true,
		},
	});

	watcher.on("event", (event) => {
		let msg;
		switch (event.code) {
			case "START":
				msg = "Rollup watcher (re)starting.";
			case "ERROR":
				msg = "Rollup (re)build error.";
			case "BUNDLE_START":
				msg = "Rollup bundle (re)build starting.";
			case "BUNDLE_END":
				msg = `Rollup bundle (re)build finished in ${event.duration}ms.`;
			case "END":
				msg = "Rollup (re)build finished.";
		}

		console.log(msg);
	});

	return watcher;
};

export { js, jsWatcher };
