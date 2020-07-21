import { src, dest, watch, lastRun } from "gulp";
import imagemin from "gulp-imagemin";

function minifyImg() {
	return src("src/assets/img/**/*.{png,jpg}", { since: lastRun(minifyImg) })
		.pipe(imagemin())
		.pipe(dest("assets/img/"));
}

function imgWatcher() {
	return watch("src/assets/img/**/*.{png,jpg}", minifyImg);
}

export { minifyImg, imgWatcher };
