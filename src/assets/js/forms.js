const setTimeZone = () => {
	const target = document.querySelector(".login-form .login-form__timezone");
	if (target) {
		console.log("target found", target);
		target.setAttribute(
			"value",
			Intl.DateTimeFormat().resolvedOptions().timeZone
		);
	}
};

export { setTimeZone };
