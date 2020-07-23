const i = require("i")(true);
import { Request as ExpressRequest, query } from "express";
import httpLinkHeader from "http-link-header";
import fetch from "node-fetch";

import { logger } from "./logger";
import { LogLevels } from "../enumerator/LogLevels";
import set from "set-value";

const endpointsWanted = [
	{
		name: "authorization_endpoint",
		key: "authorization",
	},
	{
		name: "token_endpoint",
		key: "token",
	},
	{
		name: "micropub",
		key: "micropub",
	},
];

const findEndpointInHeaders = (
	linkHeaders: httpLinkHeader,
	endpointKey: string
): string | void => {
	if (linkHeaders.has("rel", endpointKey))
		return linkHeaders.get("rel", endpointKey)[0].uri;
	return;
};

const findEndpointInBody = (
	$: CheerioStatic,
	endpoint: { key: string; name: string }
): string | Error => {
	const find = $(`link[rel="${endpoint.name}"]`).attr("href");
	if (find && new URL(find)) return find;
	return new Error(
		`Could not find ${endpoint.key} endpoint in the page source.`
	);
};

const setEndpointsFromHeaders = (
	req: ExpressRequest,
	linkHeaders: httpLinkHeader
) => {
	endpointsWanted.forEach((endpointWanted) => {
		const endpoint: string | void = findEndpointInHeaders(
			linkHeaders,
			endpointWanted.name
		);
		if (endpoint) {
			if (req.session)
				set(req.session, `endpoints.${endpointWanted.key}`, endpoint);
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
};

const setEndpointsFromBody = (req: ExpressRequest, $: CheerioStatic) => {
	endpointsWanted.forEach((endpointWanted) => {
		if (!req.session?.endpoints?.[endpointWanted.key]) {
			const endpoint = findEndpointInBody($, endpointWanted);
			if (endpoint instanceof Error) throw endpoint;
			if (req.session) {
				set(req.session, `endpoints.${endpointWanted.key}`, endpoint);

				logger.log(
					LogLevels.debug,
					`${endpointWanted.name} endpoint found in page source.`,
					{ user: req.session?.user?.profileUrl }
				);
			}
		}
	});
};

export {
	endpointsWanted,
	setEndpointsFromBody,
	findEndpointInBody,
	setEndpointsFromHeaders,
	findEndpointInHeaders,
};
