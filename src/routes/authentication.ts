import express, {
	Response as ExpressResponse,
	Request as ExpressRequest,
	NextFunction as ExpressNextFunction,
} from "express";
import fetch, { FetchError } from "node-fetch";
import httpLinkHeader from "http-link-header";
import { URLSearchParams } from "url";
import got from "got";
import cheerio from "cheerio";

// Env and other constants
import { APP_TITLE, APP_SUBTITLE, INDIEAUTH_CLIENT } from "../config/constants";

// Our interface, enums, and middleware
import { DefaultPageData } from "../interface/DefaultPageData";
import { AppUserState } from "../enumerator/AppUserState";
import { LogLevels } from "../enumerator/LogLevels";
import { csrfProtection } from "../middleware/csrfProtection";
import { urlEncodedParser } from "../middleware/urlEncodedParser";
import { getProfileAndDiscoveryUrls } from "../lib/userProfile";
import {
	endpointsWanted,
	findEndpointInBody,
	findEndpointInHeaders,
} from "../lib/endpoint";
import { logger } from "../lib/logger";

const authRouter: express.Router = express.Router();

// Send back to home page if already logged in
authRouter.use(
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		if (req.session && req.session?.isLoggedIn) {
			logger.log(
				LogLevels.verbose,
				"User tried to visit auth routes while already logged in, redirecting to the home page."
			);
			res.redirect(302, "/");
		}
		next();
	}
);

authRouter.get(
	"/",
	csrfProtection,
	(req: ExpressRequest, res: ExpressResponse) => {
		// Is there any error?
		const pageData: DefaultPageData = {
			title: APP_TITLE,
			subtitle: APP_SUBTITLE,
			pageTitle: "Login",
			appState: req.session?.appState || AppUserState.Guest,
			csrfToken: req.csrfToken(),
		};

		logger.log(
			LogLevels.silly,
			`Sending CSRF token ${pageData.csrfToken} for session ID ${req.session?.id}`
		);

		pageData.error = req.session?.error;
		if (req.session) req.session.error = null;

		// Render the login page with a token
		res.render("login", pageData);
	}
);

authRouter.post(
	"/try/",
	urlEncodedParser,
	csrfProtection,
	async (
		req: ExpressRequest,
		res: ExpressResponse,
		next: ExpressNextFunction
	) => {
		// TODO Fix nesting hell
		logger.log(LogLevels.silly, "Received a login request.");
		// Basic check for existence
		if (req.body?.me === undefined) {
			next({
				code: "AppError",
				message: "No web address specified.",
			});
		}

		// Set user's timezone
		// TODO Let them select this explicity in a config area if they're not happy with assumed timezone, or simply want to change it temporarily.
		if (req.session && req.body?.timezone) {
			req.session.user = Object.assign({}, req.session.user, {
				timezone: req.body.timezone,
			});
			logger.log(
				LogLevels.info,
				`User timezone set to ${req.body.timezone}`
			);
		}

		try {
			logger.log(
				LogLevels.debug,
				"Beginning the process of getting user's profile and discovery URLs",
				{ user: req.session?.user?.profileUrl }
			);
			let response = await getProfileAndDiscoveryUrls(req.body.me);
			if (response instanceof Error) throw response;

			// We have the Profile URL and the Discovery URL
			if (req.session) {
				req.session.user = Object.assign(
					{},
					req.session.user,
					response
				);
				logger.log(
					LogLevels.debug,
					`User profile and discovery URLs set to ${response.profileUrl} and ${response.discoveryUrl} respectively.`,
					{ user: req.session?.user?.profileUrl }
				);
			}
		} catch (error) {
			next({
				code: "AppError",
				message: error.message,
			});
		}

		// First, we make a HEAD request to see if headers have been specified with the information we want. We save whatever we can find. If something remains, we make a GET request and parse the document with cheerio.
		try {
			logger.log(
				LogLevels.debug,
				"Making a request to user's discovery URL.",
				{ user: req.session?.user?.profileUrl }
			);
			let response = await fetch(req.session?.user?.discoveryUrl, {
				method: "HEAD",
				follow: 1,
			});

			if (!response.ok) {
				throw new Error(
					"Error while getting headers from your web address."
				);
			}

			if (req.session) req.session.endpoints = {};

			// Look for required headers and collect whatever we can into session data
			logger.log(
				LogLevels.debug,
				`Checking link HTTP headers for endpoint discovery.`,
				{ user: req.session?.user?.profileUrl }
			);
			if (response.headers.get("link")) {
				logger.log(LogLevels.debug, `Link headers found`, {
					user: req.session?.user?.profileUrl,
				});

				const linkHeaders = new httpLinkHeader(
					response.headers.get("link") as string
				);

				endpointsWanted.forEach((endpointWanted) => {
					const endpoint: string | void = findEndpointInHeaders(
						linkHeaders,
						endpointWanted.name
					);
					if (endpoint) {
						if (req.session)
							req.session.endpoints[
								endpointWanted.key
							] = endpoint;
						logger.log(
							LogLevels.debug,
							`${endpointWanted.name} endpoint found in Link headers.`,
							{ user: req.session?.user?.profileUrl }
						);
					} else {
						logger.log(
							LogLevels.silly,
							`${endpointWanted.name} endpoint not found in Link headers.`,
							{ user: req.session?.user?.profileUrl }
						);
					}
				});
			}

			// If we don't have all endpoints, make a GET request to parse the document and look for remaining ones
			if (
				!endpointsWanted.some(
					(endpoint) => !!req.session?.endpoints?.[endpoint.key]
				)
			) {
				if (!req.session?.user?.discoveryUrl) {
					throw new Error(
						"We could not make a request to the discovery endpoint."
					);
				}
				got(req.session.user.discoveryUrl, {
					method: "GET",
					followRedirect: true,
					maxRedirects: 1,
				})
					.then((response) => {
						if (
							!(
								response.statusCode >= 200 &&
								response.statusCode < 300
							)
						) {
							throw new Error(
								"Error while parsing the page source of your web address."
							);
						}

						if (
							!response.headers["content-type"] ||
							!response.headers["content-type"].includes(
								"text/html"
							)
						) {
							throw new Error(
								"The web address did not return HTML content. Are the headers set correctly?"
							);
						}

						const $ = cheerio.load(response.body);
						endpointsWanted.forEach((endpointWanted) => {
							if (!req.session?.endpoints?.[endpointWanted.key]) {
								const endpoint = findEndpointInBody(
									$,
									endpointWanted
								);
								if (endpoint instanceof Error) throw endpoint;
								if (req.session) {
									req.session.endpoints[
										endpointWanted.key
									] = endpoint;

									logger.log(
										LogLevels.debug,
										`${endpointWanted.name} endpoint found in page source.`,
										{ user: req.session?.user?.profileUrl }
									);
								}
							}
						});

						// We have all the endpoints. If we're here, there was no need to parse page source.
						logger.log(LogLevels.silly, req.session);
						logger.log(
							LogLevels.debug,
							"Endpoints collected from HTTP headers and/or by parsing DOM. Redirecting to our internal auth endpoint to start authorization flow.",
							{ user: req.session?.user?.profileUrl }
						);
						res.redirect(302, "/login/auth/");
					})
					.catch((error: FetchError | Error) => {
						next({
							code: "AppError",
							message: error.message,
						});
					});
			} else {
				// We have all the endpoints already. If we're here, there was no need to parse page source.
				logger.log(LogLevels.silly, req.session);
				logger.log(
					LogLevels.debug,
					"Endpoints collected from HTTP headers. Redirecting to our internal auth endpoint to start authorization flow.",
					{ user: req.session?.user?.profileUrl }
				);
				res.redirect(302, "/login/auth/");
			}
		} catch (error) {
			next({
				code: "AppError",
				message: error.message,
			});
		}
	}
);

authRouter.get(
	"/auth/",
	csrfProtection,
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		// Start auth flow to the authorization_endpoint
		if (req.session?.endpoints?.authorization) {
			const authData = new URLSearchParams();
			authData.append("me", req.session?.user?.profileUrl);
			authData.append("client_id", INDIEAUTH_CLIENT.client_id);
			authData.append("redirect_uri", INDIEAUTH_CLIENT.redirect_uri);
			authData.append("state", req.session?.csrfSecret);
			authData.append("scope", "create");
			authData.append("response_type", "code");

			logger.log(
				LogLevels.debug,
				"Making a request to the authorization server.",
				{ user: req.session?.user?.profileUrl }
			);

			res.redirect(
				302,
				`${req.session.endpoints.authorization}?${authData.toString()}`
			);
		} else {
			next({
				code: "AppError",
				message:
					"Uh oh. It looks like we somehow lost the authorization endpoint while processing your request. Try again?",
			});
		}
	}
);

authRouter.get(
	"/callback/",
	csrfProtection,
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		// Check: Have we received a code?
		if (req.query.code) {
			logger.log(
				LogLevels.debug,
				"Received a response with code from the authorization server.",
				{ user: req.session?.user?.profileUrl }
			);
			const params = new URLSearchParams();
			// params.append("me", req.session?.userProfileURL);
			params.append("client_id", INDIEAUTH_CLIENT.client_id);
			params.append("redirect_uri", INDIEAUTH_CLIENT.redirect_uri);
			params.append("code", req.query.code as string);

			// Now send a request to verify this code and get an identity of the user back
			if (!req.session?.endpoints?.authorization) {
				throw {
					code: "AppError",
					message:
						"We could not make a request to the authorization endpoint.",
				};
			}
			logger.log(
				LogLevels.debug,
				"Verifying the code with the authorization server.",
				{ user: req.session?.user?.profileUrl }
			);
			fetch(req.session.endpoints.authorization, {
				method: "POST",
				headers: {
					Accept: "application/json",
				},
				body: params,
			})
				.then((response) => response.json())
				.then((data: { me: string; scope: string }) => {
					if (!data?.me) {
						throw new Error(
							"The authorization server did not return your canonical URL."
						);
					}

					if (!data?.scope) {
						throw new Error(
							"The authorization server did not return any scope."
						);
					}

					logger.log(
						LogLevels.debug,
						"Code verified with the authorization server.",
						{ user: req.session?.user?.profileUrl }
					);

					if (req.session) req.session.code = req.query.code;
					res.redirect(302, "/login/token/");
				})
				.catch((error) => {
					next({
						code: "AppError",
						message: error.message,
					});
				});
		} else {
			next({
				code: "AppError",
				message: "No code provided by the authorization server.",
			});
		}
	}
);

// Error handler for bad CSRF token
authRouter.use(
	(
		// TODO Error type definitions?
		err: { code: string },
		req: ExpressRequest,
		res: ExpressResponse,
		next: ExpressNextFunction
	) => {
		if (err.code !== "EBADCSRFTOKEN") return next(err);

		// handle CSRF token errors here
		next({
			code: "AppError",
			message: "Form tampered with.",
		});
	}
);

authRouter.get(
	"/token/",
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		if (req.session?.endpoints?.token) {
			logger.log(
				LogLevels.debug,
				"Making a request to the token server to get a token using the code received from the authorization server.",
				{ user: req.session?.user?.profileUrl }
			);
			const params = new URLSearchParams();
			params.append("me", req.session?.user?.profileUrl);
			params.append("client_id", INDIEAUTH_CLIENT.client_id);
			params.append("redirect_uri", INDIEAUTH_CLIENT.redirect_uri);
			params.append("code", req.session?.code);
			params.append("grant_type", "authorization_code");

			// Now send a request to get an access token
			fetch(req.session?.endpoints?.token, {
				method: "POST",
				headers: {
					Accept: "application/json",
				},
				body: params,
			})
				.then((response) => response.json())
				.then(
					(data: {
						access_token: string;
						token_type: string;
						scope: string;
						me: string;
					}) => {
						if (!data?.access_token) {
							throw new Error(
								"We did not receive an access token from the token endpoint."
							);
						}
						if (!data?.token_type) {
							throw new Error(
								"We received an access token but not the access token type from the token endpoint."
							);
						}
						if (!data?.scope) {
							throw new Error(
								"We received an access token and its type without any scope. This token was issued incorrectly."
							);
						}

						logger.log(
							LogLevels.debug,
							"Received a valid response from the token server.",
							{ user: req.session?.user?.profileUrl }
						);

						if (req.session) {
							logger.log(
								LogLevels.debug,
								"Setting indieauth properties for the session.",
								{ user: req.session?.user?.profileUrl }
							);
							req.session.code = null;
							req.session.indieauth = {};
							req.session.indieauth.access_token =
								data?.access_token;
							req.session.indieauth.token_type = data?.token_type;
							req.session.indieauth.scope = data?.scope;

							// ! loggedIn is ONLY ever set here. This is, for now, a sane way to know if a user is really logged in or not.
							req.session.isLoggedIn = true;
							req.session.appState = AppUserState.User;
						}
						res.redirect(302, "/");
					}
				)
				.catch((error) => {
					next({
						code: "AppError",
						message: error.message,
					});
				});
		} else {
			next({
				code: "AppError",
				message:
					"Strangely, the token endpoint went missing while processing your request. Try again?",
			});
		}
	}
);

export { authRouter };
