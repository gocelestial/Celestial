import { emoji } from "./emoji";
import { userMenu, activeNavigation } from "./navigation";
import { setTimezone } from "./forms";

window.addEventListener("DOMContentLoaded", () => {
	emoji();
	activeNavigation();
	userMenu();

	if (document.querySelectorAll("form").length) {
		// TODO Only used on login form
		setTimezone();
	}
});
