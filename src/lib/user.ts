import fetch from "node-fetch";
import isIp from "is-ip";
import { Request as ExpressRequest } from "express";
import set from "set-value";
import { timeZonesNames } from "@vvo/tzdb";
import { Image } from "microformats-parser/dist/types";

import { LogLevels } from "../enumerator/LogLevels";

import { logger } from "./logger";
import { parseProperty } from "./microformats";
import { FormEncoding } from "../enumerator/FormEncoding";

const makeUrl = (url: string): URL => {
	// Has the user entered any protocol at all - simple check for '://'
	// Also note that if no pathname is specified, '/' is assumed by the URL class. We don't need to take care of this check later on.
	if (url.indexOf("://")) {
		logger.log(
			LogLevels.debug,
			"User has specified a protocol in their web address."
		);
		return new URL(url.toLowerCase());
	} else {
		logger.log(
			LogLevels.debug,
			"User has not specified a protocol in their web address, attaching http://"
		);
		// If http[s] not input the user, assume http
		return new URL(String.prototype.concat("http://", url.toLowerCase()));
	}
};

const isValidUrl = (url: URL): boolean | Error => {
	try {
		if (url.username)
			throw new Error(
				"The URL specified is invalid, as it includes a username."
			);
		if (url.password)
			throw new Error(
				"The URL specified is invalid, as it includes a password."
			);
		if (url.port)
			throw new Error(
				"The URL specified is invalid, as it includes a port."
			);
		if (!["http:", "https:"].includes(url.protocol))
			throw new Error(
				"The URL specified is invalid, as its protocol is neither HTTP nor HTTPS."
			);
		if (url.hash)
			throw new Error(
				"The URL specified is invalid, as it includes a hash/fragment."
			);

		if (isIp(url.toString()))
			throw new Error(
				"The URL specified is invalid, as it is an IP address (v4/v6)."
			);

		// ! IndieAuth spec violation.
		// TODO Unfortunately, URL discards pathname upto where it contains a single-dot or a double-dot path segment. For now, we've opted not to perform this check when validating.
		// if (
		// 	url.pathname
		// 		.split("/")
		// 		.some((segment) => [".", ".."].includes(segment))
		// )
		// 	throw new Error(
		// 		"The URL specified is invalid, as it contains either a single-dot or a double-dot path segment."
		// 	);

		return true;
	} catch (error) {
		return error;
	}
};

const getProfileAndDiscoveryUrls = (
	startingUrl: string
): Promise<{ discoveryUrl: string; profileUrl: string } | Error> =>
	new Promise((resolve, reject) => {
		let profileUrl: URL, discoveryUrl: URL, assumedUrl: URL;

		// IndieAuth W3C Living Standard 25 January 2020
		// 3.1 https://indieauth.spec.indieweb.org/#user-profile-url
		// 3.2 https://indieauth.spec.indieweb.org/#client-identifier
		// 3.3 https://indieauth.spec.indieweb.org/#url-canonicalization
		// 4.2 https://indieauth.spec.indieweb.org/#discovery-by-clients

		assumedUrl = makeUrl(startingUrl);

		// Perform validation checks as per spec
		const isValid = isValidUrl(assumedUrl);
		if (isValid instanceof Error) {
			throw { code: "AppError", message: isValid.message };
		} else {
			logger.log(
				LogLevels.debug,
				"User's web address has been validated successfully."
			);
			fetch(assumedUrl.toString(), {
				method: "HEAD",
				redirect: "manual",
			})
				.then((response) => {
					logger.log(
						LogLevels.debug,
						"Received a response to our HEAD request from the user's web address."
					);
					// Check if this was a temporary redirect
					if (response.status === 302 || response.status === 307) {
						if (response.headers.get("Location") === null) {
							throw new Error(
								"We were given a temporary redirect to follow but the Location HTTP header was missing."
							);
						}

						logger.log(
							LogLevels.debug,
							"Found a temporary redirect, following redirect."
						);

						fetch(response.headers.get("Location") as string)
							.then((response) => {
								if (!response.ok)
									throw new Error(
										"We followed a temporary redirect but there was a problem fetching the redirected URL."
									);

								// Profile/Identity URL is the one entered by user
								// Discovery URL is the redirected URL
								logger.log(
									LogLevels.debug,
									"Received a response from the redirected URL. Setting profile and discovery URLs now."
								);
								profileUrl = new URL(assumedUrl.toString());
								discoveryUrl = new URL(
									response.headers.get("Location") as string
								);
								resolve({
									profileUrl: profileUrl.toString(),
									discoveryUrl: discoveryUrl.toString(),
								});
							})
							.catch((error) => reject(error));
					}
					// Was it a permanent redirect?
					else if (
						response.status === 301 ||
						response.status === 308
					) {
						// Profile and discovery URL are, both, the redirected URL
						logger.log(
							LogLevels.debug,
							"Permanent redirect found. Assuming the redirected URL to be correct web address for this user."
						);

						if (response.headers.get("Location") === null) {
							throw new Error(
								"We were given a permanent redirect to follow, but the Location HTTP header was missing."
							);
						}

						profileUrl = discoveryUrl = new URL(
							response.headers.get("Location") as string
						);
						resolve({
							profileUrl: profileUrl.toString(),
							discoveryUrl: discoveryUrl.toString(),
						});
					} else {
						// Fallback. The URL we have is what we need to use.
						logger.log(
							LogLevels.debug,
							"We did not find either a temporary or a permanent redirect."
						);
						profileUrl = discoveryUrl = assumedUrl;
						resolve({
							profileUrl: profileUrl.toString(),
							discoveryUrl: discoveryUrl.toString(),
						});
					}
				})
				.catch((error) => reject(error));
		}
	});

/**
 * @param req Make sure the request body has timezone property available. If not, the timezone will be set to undefined.
 */

const setProfileDetails = (req: ExpressRequest, document: string): void => {
	logger.log(
		LogLevels.debug,
		"Attempting to find a name and photo for the user."
	);

	const name = parseProperty(
		document,
		req.session?.user?.discoveryUrl,
		"h-card",
		"name"
	);

	const photo = parseProperty(
		document,
		req.session?.user?.discoveryUrl,
		"h-card",
		"photo"
	);

	if (req.session) {
		logger.log(
			LogLevels.debug,
			"Saving the name and a URL to the photo for the user to session now.",
			{
				user: req.session?.user?.profileUrl,
				name: name ? name[0] : "Did not find any name.",
				photo: photo
					? (photo[0] as Image).value
						? (photo[0] as Image).value
						: (photo[0] as Image)
					: "Did not find any photo.",
			}
		);

		if (name) set(req.session, "user.microformats.name", name[0]);

		if (photo)
			set(
				req.session,
				"user.microformats.photo",
				photo
					? (photo[0] as Image).value
						? (photo[0] as Image).value
						: (photo[0] as Image)
					: undefined
			);
	}
};

/**
 * @param key Do not use a key which includes a hyphen or any such characters making usage of dot notation errant/impossible.
 */
const setUserPreference = (
	req: ExpressRequest,
	key: string,
	value: any
): void => {
	if (req.session) {
		set(req.session, `user.preferences.${key}`, value);

		logger.log(LogLevels.verbose, `User preferences updated.`, {
			[key]: value,
		});
	}
};

const areAllPreferencesValid = (req: ExpressRequest): boolean => {
	let isValidEncoding = false,
		isValidTimezone = false;
	if (req.body?.["form-encoding"]) {
		// Validate the form encoding value received
		// https://stackoverflow.com/a/39372911/2464435
		Object.values(FormEncoding).forEach((encoding) => {
			if (encoding === req.body["form-encoding"]) {
				isValidEncoding = true;
				logger.log(
					LogLevels.debug,
					"Form encoding preference validated",
					{ user: req.session?.user?.profileUrl }
				);
			}
		});
	}

	if (req.body?.["user-timezone"]) {
		// Validate the timezone received
		isValidTimezone = Array.prototype.some.call(
			timeZonesNames,
			(tzName: string) => tzName === req.body["user-timezone"]
		);

		if (isValidTimezone)
			logger.log(LogLevels.debug, "Timezone preference validated", {
				user: req.session?.user?.profileUrl,
			});
	}

	if (isValidEncoding && isValidTimezone) return true;

	return false;
};

export {
	areAllPreferencesValid,
	getProfileAndDiscoveryUrls,
	setProfileDetails,
	setUserPreference,
};
