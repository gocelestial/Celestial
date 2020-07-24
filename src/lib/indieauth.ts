import { Request as ExpressRequest } from "express";
import { logger } from "./logger";
import { LogLevels } from "../enumerator/LogLevels";
import { IndieAuthToken } from "../interface/IndieAuth";

const setAuthData = (req: ExpressRequest, data: IndieAuthToken): void => {
	logger.log(
		LogLevels.debug,
		"Setting indieauth properties for the session.",
		{ user: req.session?.user?.profileUrl }
	);

	if (req.session && !req.session?.indieauth) req.session.indieauth = {};

	if (req.session) {
		req.session.indieauth.access_token = data?.access_token;
		req.session.indieauth.token_type = data?.token_type;
		req.session.indieauth.scope = data?.scope;
	}
};

const cleanupAuthData = (req: ExpressRequest): void => {
	logger.log(
		LogLevels.debug,
		"Removing intermediate code form IndieAuth session data.",
		{ user: req.session?.user?.profileUrl }
	);
	if (req.session && req.session.indieauth) delete req.session.indieauth.code;
};

export { cleanupAuthData, setAuthData };
