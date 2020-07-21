const i = require("i")(true);
import cheerio from "cheerio";
import httpLinkHeader from "http-link-header";

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

export { endpointsWanted, findEndpointInBody, findEndpointInHeaders };
