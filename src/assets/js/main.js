import { emoji } from "./emoji";
import { activeNavigation } from "./navigation";
import { setFormDefaults } from "./publish";

// import { NoteForm } from "./components/NoteForm";
// import React from "react";
// import ReactDOM from "react-dom";

window.addEventListener("DOMContentLoaded", () => {
	emoji();
	activeNavigation();

	// TODO
	if (document.querySelectorAll("form").length) {
		setFormDefaults();
	}
});
