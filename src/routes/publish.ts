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

// Our interface, enums, middleware
import { DefaultPageData } from "../interface/DefaultPageData";
import { PostPageData } from "../interface/PostPageData";
import { AppUserState } from "../enumerator/AppUserState";
import { urlEncodedParser } from "../middleware/urlEncodedParser";
import { utcToUserTimezone, userTimezoneToUtc } from "../lib/date";
import { parseISO } from "date-fns";

const publishRouter = Router();

// Validate session exists or redirect to login
publishRouter.use(
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		if (req.session && !req.session.isLoggedIn) {
			next({
				code: "AppError",
				message: "You need to login first.",
			});
		}
		next();
	}
);

// move this somewhere else if desired
const pageDataHelper = function(req: ExpressRequest, data: Object) : DefaultPageData {
    return {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null
    }
}

publishRouter.get("/success/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Post Successfully Created",
		postLink: req.session?.postLink,
		// TODO Add syndication links when available
	});

	// Now reset it back.
	if (req.session) req.session.postLink = null;
	res.render("publish/success", pageData);
});

// TODO All of the endpoints below appear to be a bit repetitive. We can probably abstract away many parts of the process into generic libs as well.

publishRouter.get("/article/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Article",
	});

	res.render("publish/article", pageData);
});

publishRouter.get("/note/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Note",
		error: req.session?.error || null,
		formDefaults: {
			published: {
				date: utcToUserTimezone(
					new Date(),
					req.session?.user?.timezone,
					"yyyy-MM-dd"
				).toString(),
				time: utcToUserTimezone(
					new Date(),
					req.session?.user?.timezone,
					"HH:mm"
				).toString(),
			},
		},
	});

	if (req.session && req.session?.error) req.session.error = null;

	res.render("publish/note", pageData);
});

publishRouter.post(
	"/note/",
	urlEncodedParser,
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		// Make a POST url encoded request to the micropub endpoint, along with the access token
		// console.log(req.body);
		// debugger;

		// The date and time we receive are in user's tz
		// Looking at the source code of Indiekit, we'd like to send the date as an ISO8601 date (any timezone will work as they format it to UTC ultimately)
		const published = new Date(`${req.body.date} ${req.body.time}`);

		const params = new URLSearchParams();
		params.append("h", req.body.h);
		params.append("content", req.body.note);
		params.append("published", published.toString());

		fetch(req.session?.endpoints?.micropub, {
			method: "POST",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${req.session?.access_token}`,
			},
			body: params,
		})
			.then((response) => {
				if (!response.ok) throw new Error("Could not create post.");

				if (response.headers.get("Location"))
					if (req.session)
						req.session.postLink = response.headers.get("Location");
				res.redirect(302, "/publish/success/");
			})
			.catch((error: Error | TypeError) => {
				next({
					code: "AppError",
					message: error.message,
				});
			});
	}
);

publishRouter.get("/reply/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Reply",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/reply", pageData);
});

publishRouter.get("/like/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Like",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/like", pageData);
});

publishRouter.get("/repost/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Repost",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/repost", pageData);
});

publishRouter.get("/bookmark/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Bookmark",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/bookmark", pageData);
});

publishRouter.get("/photo/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Photo",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/photo", pageData);
});

publishRouter.get("/video/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Video",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/video", pageData);
});

publishRouter.get("/audio/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Audio",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/audio", pageData);
});

publishRouter.get("/checkin/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Checkin",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/checkin", pageData);
});

publishRouter.get("/event/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Event",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/event", pageData);
});

publishRouter.get("/rsvp/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "RSVP",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
	};

	res.render("publish/rsvp", pageData);
});

export { publishRouter };
