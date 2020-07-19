import * as env from "env-var";
const inflect = require("i")();

export const PORT: number = env.get("PORT").default("4000").asPortNumber();

export const REDIS_PASSWORD: string = env
	.get("REDIS_PASSWORD")
	.default("Sp4cPXot9awS5kWNteB3hr")
	.asString();

export const APP_TITLE: string = inflect.titleize(
	require("/app/package.json").name
);

export const APP_SUBTITLE: string = require("/app/package.json").description;

export const INDIEAUTH_CLIENT: {
	client_id: string;
	redirect_uri: string;
} = {
	client_id: "http://localhost:4000/",
	redirect_uri: "http://localhost:4000/login/callback/",
};
