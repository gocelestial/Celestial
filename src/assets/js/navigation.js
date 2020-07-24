const _debounce = require("lodash.debounce");

const activeNavigation = () => {
	const links = document.querySelectorAll(".navigation__link");
	Array.prototype.forEach.call(links, (link) => {
		if (link.pathname == window.location.pathname)
			link.classList.add("navigation__link--active");
	});
};

const userMenu = () => {
	const menuToggle = document.querySelector(".page-header__user-identity");

	const eventHandler = () =>
		document
			.querySelector(".user-menu")
			.classList.toggle("user-menu--active");

	["click", "keyup"].forEach((eventType) =>
		menuToggle.addEventListener(
			eventType,
			(event) => {
				if (event.type === "keyup" && event.code !== "Enter") return;
				if (event.type === "keyup") _debounce(eventHandler, 600);
				else eventHandler();
			},
			{ passive: true }
		)
	);

	menuToggle.addEventListener(
		"blur",
		(event) => {
			// Many browsers implement a 300-350ms delay for registering a single click
			window.setTimeout(() => {
				document
					.querySelector(".user-menu")
					.classList.remove("user-menu--active");
			}, 351);
		},
		{ passive: true }
	);
};

export { userMenu, activeNavigation };
