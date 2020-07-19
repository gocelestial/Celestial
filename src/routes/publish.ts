import {
	Router,
	Request as ExpressRequest,
	Response as ExpressResponse,
	NextFunction as ExpressNextFunction,
} from "express";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

// Env and other constants
import { APP_TITLE, APP_SUBTITLE } from "../config/constants";

// Our interface and enums
import { DefaultPageData } from "../interface/DefaultPageData";
import { PostPageData } from "../interface/PostPageData";
import { AppUserState } from "../enumerator/AppUserState";
import { urlEncodedParser } from "../middleware/urlEncodedParser";

const publishRouter = Router();

// Validate session exists or redirect to login
publishRouter.use(
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		if (req?.session?.data?.me) {
			res.redirect(302, "/login/");
		}
		next();
	}
);

publishRouter.get("/success/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Post Successfully Created",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
		postLink: req.session?.postLink,
		// TODO Add syndication links when available
	};

	// Now reset it back.
	if (req.session) req.session.postLink = null;
	res.render("publish/success");
});

publishRouter.get("/article/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Article",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/article", pageData);
});

publishRouter.get("/note/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Note",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
		error: req.session?.error || null,
	};

	if (req.session && req.session?.error) req.session.error = null;

	res.render("publish/note", pageData);
});

publishRouter.post(
	"/note/",
	urlEncodedParser,
	(req: ExpressRequest, res: ExpressResponse) => {
		// Make a POST url encoded request to the micropub endpoint, along with the access token
		const params = new URLSearchParams();
		params.append("h", req.body.h);
		params.append("content", req.body.note);
		
		fetch(req.session?.endpoints?.micropub, {
			method: "POST",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${req.session?.access_token}`,
			},
			body: params,
		})
			.then((response) => {
				console.log(response);
				if (!response.ok) throw new Error("Could not create post.");

				if (response.headers.get("Location"))
					if (req.session)
						req.session.postLink = req.session.get("Location");
				res.redirect(302, "/publish/success/");
			})
			.catch((error: Error | TypeError) => {
				console.log(error);
				if (req.session) req.session.error = error.message;
				res.redirect("/publish/note/");
			});
	}
);

publishRouter.get("/reply/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Reply",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/reply", pageData);
});

publishRouter.get("/like/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Like",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/like", pageData);
});

publishRouter.get("/repost/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Repost",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/repost", pageData);
});

publishRouter.get("/bookmark/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Bookmark",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/bookmark", pageData);
});

publishRouter.get("/photo/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Photo",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/photo", pageData);
});

publishRouter.get("/video/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Video",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/video", pageData);
});

publishRouter.get("/audio/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Audio",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/audio", pageData);
});

publishRouter.get("/checkin/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Checkin",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/checkin", pageData);
});

publishRouter.get("/event/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Event",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/event", pageData);
});

publishRouter.get("/rsvp/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "RSVP",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
	};

	res.render("publish/rsvp", pageData);
});

export { publishRouter };
