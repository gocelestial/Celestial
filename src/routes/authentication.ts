import { Router } from "express";
import fetch from "node-fetch";
import { csrfProtection } from "../middleware/csrfProtection";

// Env and other constants
import {
	APP_TITLE,
    APP_SUBTITLE,
    INDIELOGIN
} from "../config/constants";

const authRouter = Router();

authRouter.get("/", csrfProtection, (req, res) => {
	// Is there any error?
	const pageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		appState: req.session.appState || "guest",
		csrfToken: req.csrfToken(),
		error: null,
		indielogin: INDIELOGIN,
	};

	console.log(
		`Sending CSRF token ${pageData.csrfToken} for session ID ${req.session.id}`
	);

	if (req.session.error) {
		pageData.error = req.session.error;
		req.session.error = null;
	}

	// Render the login page with a token
	res.render("login", pageData);
});

// Middleware - error handler
authRouter.use((err, req, res, next) => {
	if (err.code !== "EBADCSRFTOKEN") return next(err);

	// handle CSRF token errors here
	req.session.error = "Form tampered with.";
	res.redirect(403, "/login");
});

authRouter.use((err, req, res, next) => {
	if (err.code !== "ENOTFOUND") return next(err);

	req.session.error = "Failed to get identity details from IndieLogin.";
	res.redirect(500, "/login");
})

authRouter.get("/verify/", csrfProtection, (req, res) => {
	// This is where IndieLogin redirect is configured to

	// Check: Have we received a verification code?
	if (req.query.code) {
		const params = new URLSearchParams();
		params.append("code", req.query.code as string);
		params.append("redirect_uri", INDIELOGIN.redirect_uri);
		params.append("client_id", INDIELOGIN.client_id);

		// Now send a request to get user website details
		fetch("https://indielogin.com/auth", {
			method: "post",
			headers: {
				Accept: "application/json",
			},
			body: params,
		})
			.then((response) => response.json())
			.then((data: { me: string }) => {
				if (data.me) {
					req.session.data = data;
					res.redirect(302, "/");
					return;
				} else {
					throw new Error(
						"An error occured trying to make a call to IndieLogin."
					);
				}
			})
			.catch((error) => {
				console.log(error);
				req.session.error = error;
				res.redirect(302, "/login");
				return;
			});
	} else {
		req.session.error = "No code provided by IndieLogin.";
		res.redirect(302, "/login");
		return;
	}
});

export { authRouter };
