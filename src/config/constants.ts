import * as env from "env-var";
const inflect = require("i")();

export const PORT: number = env.get("PORT").default("4000").asPortNumber();

export const REDIS_PASSWORD: string = env.get("REDIS_PASSWORD").asString();

export const APP_TITLE: string = inflect.titleize(
	require("/app/package.json").name
);

export const APP_SUBTITLE: string = require("/app/package.json").description;

export const INDIELOGIN: {
	auth: string;
	client_id: string;
	redirect_uri: string;
} = {
	auth: "https://indielogin.com/auth",
	client_id: "http://localhost:4000/",
	redirect_uri: "http://localhost:4000/login/verify/",
};
