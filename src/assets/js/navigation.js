const activeNavigation = () => {
	const links = document.querySelectorAll(".navigation__link");
	Array.prototype.forEach.call(links, (link) => {
		if (link.pathname == window.location.pathname)
			link.classList.add("navigation__link--active");
	});
};

export { activeNavigation };
