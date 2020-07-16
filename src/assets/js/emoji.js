const emoji = () => {
	if (window.twemoji) window.twemoji.parse(document.body);
};

export { emoji };
