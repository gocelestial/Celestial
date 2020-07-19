import express, {
	Response as ExpressResponse,
	Request as ExpressRequest,
} from "express";
import fetch, { FetchError } from "node-fetch";

import { URLSearchParams } from "url";

const logoutRouter = express.Router();

logoutRouter.get("/", (req: ExpressRequest, res: ExpressResponse) => {
	const params = new URLSearchParams();
	params.append("me", req.session?.validatedUserProfileURL);
	params.append("action", "revoke");
	params.append("token", req.session?.access_token);

	fetch(req.session?.endpoints?.token, {
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
				});
			}
			res.redirect(302, "/");
		})
		.catch((error: Error) => {
			console.log(error);
			if (req.session) req.session.error = error.message;
			res.redirect(302, "/");
		});
});

export { logoutRouter };
