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
const pageDataHelper = function (
	req: ExpressRequest,
	data: object
): DefaultPageData | PostPageData | AuthPageData | UserPageData {
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
					identity: req.session?.user?.profileUrl || null,
				},
			},
		},
		data
	);
};

export { pageDataHelper };
