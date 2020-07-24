interface IndieAuthToken {
	access_token: string;
	token_type: string;
	scope: string;
	me: string;
}

export { IndieAuthToken };
