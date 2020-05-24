import * as env from "env-var";

export const PORT: number = env.get("PORT").default("4000").asPortNumber();