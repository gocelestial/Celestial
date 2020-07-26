import {
	Router,
	Request as ExpressRequest,
	Response as ExpressResponse,
	NextFunction as ExpressNextFunction,
} from "express";
import { timeZonesNames } from "@vvo/tzdb";

import { UserPageData, PreferencesPageData } from "../interface/PageData";
import { pageDataHelper, enumValuesAsArray } from "../lib/helpers";
import { setUserPreference, areAllPreferencesValid } from "../lib/user";
import { urlEncodedParser } from "../middleware/urlEncodedParser";
import { FormEncoding } from "../enumerator/FormEncoding";
import { LogLevels } from "../enumerator/LogLevels";
import { logger } from "../lib/logger";

const userRouter = Router();

userRouter.get("/profile/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData = pageDataHelper(req, {
		pageTitle: "My Profile",
		userDetails: {
			endpoints: req.session?.endpoints,
			indieauth: {
				scope: req.session?.indieauth?.scope,
			},
			urls: {
				profile: req.session?.user?.profileUrl,
				discovery: req.session?.user?.discoveryUrl,
			},
		},
	}) as UserPageData;

	res.render("user/profile", pageData);
});

userRouter.get("/preferences/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData = pageDataHelper(req, {
		pageTitle: "Preferences",
		formDefaults: {
			encodings: enumValuesAsArray(FormEncoding),
			timezones: timeZonesNames,
		},
	}) as PreferencesPageData;

	res.render("user/preferences", pageData);
});

userRouter.post(
	"/preferences/",
	urlEncodedParser,
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		logger.log(
			LogLevels.debug,
			"Received a request to update user preferences",
			{ user: req.session?.user?.profileUrl, form: req.body }
		);
		if (areAllPreferencesValid(req)) {
			setUserPreference(req, "formEncoding", req.body["form-encoding"]);
			setUserPreference(req, "timezone", req.body["user-timezone"]);
			// TODO Details updated message to user
			res.redirect("/user/preferences");
		} else {
			next({
				code: "AppError",
				message:
					"Could not validate the form encoding or the timezone or both.",
			});
		}
	}
);

export { userRouter };
