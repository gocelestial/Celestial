import { emoji } from "./emoji";
import { activeNavigation } from "./navigation";
import { setTimezone } from "./forms";

window.addEventListener("DOMContentLoaded", () => {
	emoji();
	activeNavigation();

	if (document.querySelectorAll("form").length) {
		// TODO Only used on login form
		setTimezone();
	}
});
