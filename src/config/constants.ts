import * as env from "env-var";

export const PORT: number = env.get("PORT").default("4000").asPortNumber();

export const REDIS_PASSWORD: String = env.get("REDIS_PASSWORD").asString();
