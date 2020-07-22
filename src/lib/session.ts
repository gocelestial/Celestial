import { Request as ExpressRequest } from "express";

/**
 * Only clears top-level keys.
 * @param keys Keys you want to delete from the session.
 */
const resetEphemeralSessionData = (
	req: ExpressRequest,
	keys: string[]
): void => {
	if (req.session) {
		keys.forEach((key) => {
			if (req.session?.[key]) delete req.session[key];
		});
	}
};

export { resetEphemeralSessionData };
