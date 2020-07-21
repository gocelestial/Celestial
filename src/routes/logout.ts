import express, {
	Response as ExpressResponse,
	Request as ExpressRequest,
	NextFunction as ExpressNextFunction,
} from "express";
import fetch, { FetchError } from "node-fetch";
import { URLSearchParams } from "url";

import { logger } from "../lib/logger";
import { LogLevels } from "../enumerator/LogLevels";

const logoutRouter = express.Router();

logoutRouter.get(
	"/",
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		logger.log(LogLevels.debug, "Received a request to log the user out.", {
			user: req.session?.user?.profileUrl,
		});
		const params = new URLSearchParams();
		params.append("me", req.session?.user?.profileUrl);
		params.append("action", "revoke");
		params.append("token", req.session?.access_token);

		if (!req.session?.endpoints?.token)
			throw {
				code: "AppError",
				message:
					"Cannot find the token endpoint for this session. You might need to clear your cookies to access the client again.",
			};

		fetch(req.session.endpoints.token, {
			method: "POST",
			headers: {
				Accept: "application/json",
			},
			body: params,
		})
			.then((response) => {
				if (response?.ok) return response;
				else return response.json();
			})
			.then((data) => {
				if (data.error) throw new Error(data.error_description);
				if (req.session) {
					req.session.destroy((error) => {
						if (error) throw new Error(error);
						logger.log(
							LogLevels.debug,
							"Logout successful, redirecting to the home page."
						);
						res.redirect(302, "/");
					});
				}
			})
			.catch((error: Error) => {
				next({
					code: "AppError",
					message: error.message,
				});
			});
	}
);

export { logoutRouter };
