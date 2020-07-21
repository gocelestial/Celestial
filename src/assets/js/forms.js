const setTimezone = () => {
	document.querySelector(
		"form input[name='timzone']"
	).value = Intl.DateTimeFormat().resolvedOptions().timeZone;
};
export { setTimezone };
