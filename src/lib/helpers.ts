import { Request as ExpressRequest } from "express";

import { APP_TITLE, APP_SUBTITLE } from "../config/constants";
import { AppUserState } from "../enumerator/AppUserState";
import {
	DefaultPageData,
	PostPageData,
	AuthPageData,
	UserPageData,
} from "../interface/PageData";

/**
 * Currently, the app title, subtitle, app state, and user identity is set by default. You may pass these in as well in case you wish to overwrite the defaults.
 */
const pageDataHelper = (
	req: ExpressRequest,
	data: object
): DefaultPageData | PostPageData | AuthPageData | UserPageData => {
	return Object.assign(
		{},
		{
			title: APP_TITLE,
			subtitle: APP_SUBTITLE,
			appState: req.session?.appState || AppUserState.Guest,
			user: {
				microformats: {
					name: req.session?.user?.microformats?.name,
					photo: req.session?.user?.microformats?.photo,
				},
				indieauth: {
					identity: req.session?.user?.profileUrl,
				},
				preferences: {
					timezone: req.session?.user?.preferences?.timezone,
					formEncoding: req.session?.user?.preferences?.formEncoding,
				},
			},
		},
		data
	);
};

/**
 * @param enum {any} TypeScript doesn't allow specifying a parameter type as enum. Be sure of what you're passing in.
 */
const enumValuesAsArray = (enumerator: any): Array<string> => {
	return Object.values(enumerator).map((e: string) => e);
};

export { pageDataHelper, enumValuesAsArray };
