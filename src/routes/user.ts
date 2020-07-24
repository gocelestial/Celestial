import {
	Router,
	Request as ExpressRequest,
	Response as ExpressResponse,
} from "express";

import { pageDataHelper } from "../lib/helpers";
import { UserPageData } from "../interface/PageData";

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

export { userRouter };
