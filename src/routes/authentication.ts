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
import { csrfProtection } from "../middleware/csrfProtection";
import { urlEncodedParser } from "../middleware/urlEncodedParser";
import { getProfileAndDiscoveryUrls } from "../lib/userProfile";

const authRouter: express.Router = express.Router();

// Send back to home page if already logged in
authRouter.use(
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		if (req.session && req.session.appState === AppUserState.User)
			res.redirect(302, "/");
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

		console.info(
			`Sending CSRF token ${pageData.csrfToken} for session ID ${req.session?.id}`
		);

		pageData.error = req.session?.error;
		if (req.session) req.session.error = null;

		// Render the login page with a token
		res.render("login", pageData);
	}
);

// Middleware - error handler
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
		if (req.session) req.session.error = "Form tampered with.";
		res.redirect(403, "/login/");
	}
);

authRouter.post(
	"/try/",
	urlEncodedParser,
	csrfProtection,
	(req: ExpressRequest, res: ExpressResponse) => {
		// Basic check for existence
		if (req.body?.me === undefined) {
			if (req.session) req.session.error = "No web address specified.";
			res.redirect(301, "/login/");
		}

		// Set user's timezone
		// TODO Let them select this explicity in a config area if they're not happy with assumed timezone, or simply want to change it temporarily.
		if (req.session && req.body?.timezone)
			req.session.user = Object.assign({}, req.session.user, {
				timezone: req.body.timezone,
			});

		// TODO Fix nesting hell
		getProfileAndDiscoveryUrls(req.body.me)
			.then((response) => {
				// We have the Profile URL and the Discovery URL
				if (req.session)
					req.session.user = Object.assign(
						{},
						req.session.user,
						response
					);

				// First, we make a HEAD request to see if headers have been specified with the information we want. We save whatever we can find. If something remains, we make a GET request and parse the document with cheerio.
				fetch(req.session?.user?.discoveryUrl, {
					method: "HEAD",
					follow: 1,
				})
					.then((response) => {
						if (!response.ok)
							throw new Error(
								"Error while getting headers from your web address."
							);

						if (req.session) req.session.endpoints = {};

						// Look for required headers and collect whatever we can into session data
						if (response.headers.get("link")) {
							const linkHeaders = new httpLinkHeader(
								response.headers.get("link") as string
							);

							if (
								linkHeaders.has("rel", "authorization_endpoint")
							) {
								if (req.session) {
									req.session.endpoints.authorization = linkHeaders.get(
										"rel",
										"authorization_endpoint"
									)[0].uri;
									console.info(
										"Auth endpoint found in HTTP headers."
									);
								}
							}
							if (linkHeaders.has("rel", "token_endpoint")) {
								if (req.session) {
									req.session.endpoints.token = linkHeaders.get(
										"rel",
										"token_endpoint"
									)[0].uri;
									console.info(
										"Token endpoint found in HTTP headers."
									);
								}
							}
							if (linkHeaders.has("rel", "micropub")) {
								if (req.session) {
									req.session.endpoints.micropub = linkHeaders.get(
										"rel",
										"micropub"
									)[0].uri;
									console.info(
										"Micropub endpoint found in HTTP headers."
									);
								}
							}
						}

						// If we don't have all endpoints, make a GET request to parse the document and look for remaining ones
						if (
							!req.session?.endpoints?.authorization ||
							!req.session?.endpoints?.token ||
							!req.session?.endpoints?.micropub
						) {
							console.info(
								"Did not find all endpoints in headers, fetching and parsing the page source now."
							);
							got(req.session?.user?.discoveryUrl, {
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
									)
										throw new Error(
											"Error while parsing the page source of your web address."
										);

									if (
										!response.headers["content-type"] ||
										!response.headers[
											"content-type"
										].includes("text/html")
									)
										throw new Error(
											"The web address did not return HTML content. Are the headers set correctly?"
										);

									console.info("Reading page source now.");
									const $ = cheerio.load(response.body);

									if (
										!req.session?.endpoints?.authorization
									) {
										const authEndpoint = $(
											'link[rel="authorization_endpoint"]'
										).attr("href");
										console.log(
											"Found authEndpoint",
											authEndpoint
										);
										if (
											authEndpoint &&
											new URL(authEndpoint)
										) {
											// Valid URL
											console.info(
												"Auth endpoint valid."
											);
											if (req.session)
												req.session.endpoints.authorization = authEndpoint;
										} else
											throw new Error(
												"Could not find authorization endpoint."
											);
									}

									if (!req.session?.endpoints?.token) {
										const tokenEndpoint = $(
											'link[rel="token_endpoint"]'
										).attr("href");
										console.log(
											"Found tokenEndpoint",
											tokenEndpoint
										);
										if (
											tokenEndpoint &&
											new URL(tokenEndpoint)
										) {
											console.info(
												"Token endpoint valid."
											);
											// Valid URL
											if (req.session)
												req.session.endpoints.token = tokenEndpoint;
										} else
											throw new Error(
												"Could not find token endpoint."
											);
									}

									if (!req.session?.endpoints?.micropub) {
										const micropubEndpoint = $(
											'link[rel="micropub"]'
										).attr("href");
										console.log(
											"Found micropubEndpoint",
											micropubEndpoint
										);
										if (
											micropubEndpoint &&
											new URL(micropubEndpoint)
										) {
											console.info(
												"Micropub endpoint valid."
											);
											// Valid URL
											if (req.session)
												req.session.endpoints.micropub = micropubEndpoint;
										} else
											throw new Error(
												"Could not find micropub endpoint."
											);
									}
									// Finally, start the auth flow - authorization followed by an access token, followed by a redirect to home.
									res.redirect(302, "/login/auth/");
								})
								.catch((error: FetchError | Error) => {
									console.log(error);
									if (req.session)
										req.session.error = error.message;
									res.redirect(302, "/login/");
								});
						} else {
							// We have all the endpoints. If we're here, there's no need to parse page source.
							res.redirect(302, "/login/auth/");
						}
					})
					.catch((error) => {
						if (req.session) req.session.error = error.message;
						res.redirect(302, "/login/");
					});
			})
			.catch((error) => {
				if (req.session) req.session.error = error.message;
				res.redirect(302, "/login/");
			});
	}
);

authRouter.get(
	"/auth/",
	csrfProtection,
	(req: ExpressRequest, res: ExpressResponse) => {
		// Start auth flow to the authorization_endpoint
		if (req.session?.endpoints?.authorization) {
			const authData = new URLSearchParams();
			authData.append("me", req.session?.user?.profileUrl);
			authData.append("client_id", INDIEAUTH_CLIENT.client_id);
			authData.append("redirect_uri", INDIEAUTH_CLIENT.redirect_uri);
			authData.append("state", req.session?.csrfSecret);
			authData.append("scope", "create");
			authData.append("response_type", "code");

			res.redirect(
				302,
				req.session.endpoints.authorization + "?" + authData.toString()
			);
		}
	}
);

authRouter.get(
	"/callback/",
	csrfProtection,
	(req: ExpressRequest, res: ExpressResponse) => {
		// Check: Have we received a code?
		if (req.query.code) {
			const params = new URLSearchParams();
			// params.append("me", req.session?.userProfileURL);
			params.append("client_id", INDIEAUTH_CLIENT.client_id);
			params.append("redirect_uri", INDIEAUTH_CLIENT.redirect_uri);
			params.append("code", req.query.code as string);

			// Now send a request to verify this code and get an identity of the user back
			fetch(req.session?.endpoints?.authorization, {
				method: "POST",
				headers: {
					Accept: "application/json",
				},
				body: params,
			})
				.then((response) => response.json())
				.then((data: { me: string; scope: string }) => {
					console.log(data);
					if (!data?.me)
						throw new Error(
							"The authorization server did not return your canonical URL."
						);

					if (!data?.scope)
						throw new Error(
							"The authorization server did not return any scope."
						);

					if (req.session) {
						// req.session.validatedUserProfileURL = data?.me;
						req.session.code = req.query.code;
					}
					res.redirect(302, "/login/token/");
				})
				.catch((error) => {
					console.log(error);
					if (req.session) req.session.error = error.message;
					res.redirect(302, "/login/");
				});
		} else {
			if (req.session)
				req.session.error =
					"No code provided by the authorization server.";
			res.redirect(302, "/login/");
		}
	}
);

authRouter.get("/token/", (req: ExpressRequest, res: ExpressResponse) => {
	if (req.session?.endpoints?.token) {
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
					console.log(data);
					if (!data?.access_token)
						throw new Error(
							"We did not receive an access token from the token endpoint."
						);
					if (!data?.token_type)
						throw new Error(
							"We received an access token but not the access token type from the token endpoint."
						);
					if (!data?.scope)
						throw new Error(
							"We received an access token and its type without any scope. This token was issued incorrectly."
						);

					if (req.session) {
						req.session.access_token = data?.access_token;
						req.session.token_type = data?.token_type;
						req.session.scope = data?.scope;
						console.log(data?.me);
						// req.session.validatedUserProfileURL = data?.me;
						req.session.appState = AppUserState.User;
					}
					res.redirect(302, "/");
				}
			)
			.catch((error) => {
				console.log(error);
				if (req.session) req.session.error = error.message;
				res.redirect(302, "/login/");
			});
	} else {
		if (req.session)
			req.session.error =
				"Strangely, the token endpoint went missing while processing your request. Try again?";
		res.redirect(302, "/login/");
	}
});

export { authRouter };
