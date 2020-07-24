import {
	Router,
	Request as ExpressRequest,
	Response as ExpressResponse,
	NextFunction as ExpressNextFunction,
} from "express";
import fetch from "node-fetch";
import { URLSearchParams } from "url";
import { DateTime } from "luxon";

// Our interface, enums, middleware, libs
import { PostPageData } from "../interface/PageData";

import { urlEncodedParser } from "../middleware/urlEncodedParser";

import { pageDataHelper } from "../lib/pageDataHelper";
import { resetEphemeralSessionData } from "../lib/session";
import { logger } from "../lib/logger";
import { LogLevels } from "../enumerator/LogLevels";

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

publishRouter.get("/success/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Post Successfully Created",
		postLink: req.session?.postLink,
	}) as PostPageData;

	resetEphemeralSessionData(req, ["postLink"]);

	res.render("publish/success", pageData);
});

publishRouter.get("/article/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Article",
	}) as PostPageData;

	res.render("publish/article", pageData);
});

publishRouter.get("/note/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Note",
		formDefaults: {
			published: {
				date: DateTime.utc()
					.setZone(req.session?.user?.timezone)
					.toFormat("yyyy-MM-dd")
					.toString(),
				time: DateTime.utc()
					.setZone(req.session?.user?.timezone)
					.toFormat("HH:mm")
					.toString(),
			},
		},
		"syndicate-to": req.session?.micropub?.["syndicate-to"],
		"media-endpoint": req.session?.micropub?.["media-endpoint"],
	}) as PostPageData;

	res.render("publish/note", pageData);
});

publishRouter.post(
	"/note/",
	urlEncodedParser,
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		// Make a POST url encoded request to the micropub endpoint, along with the access token
		// The date and time we receive are in user's tz
		// Looking at the source code of Indiekit, we'd like to send the date as an ISO8601 date (any timezone will work as they format it to UTC ultimately - but we'll send it in UTC for hopefully greater interoperability)
		const [year, month, day] = req.body.date.split("-");
		const [hour, minute] = req.body.time.split(":");
		const published = DateTime.fromObject({
			year,
			month,
			day,
			hour,
			minute,
			zone: req.session?.user?.timezone,
		})
			.toUTC()
			.toISO();

		const params = new URLSearchParams();
		params.append("h", req.body.h);
		params.append("content", req.body.note);
		params.append("published", published.toString());

		logger.log(
			LogLevels.http,
			"Sending publish request to your Micropub server.",
			{
				h: params.get("h"),
				content: params.get("content"),
				published: params.get("published"),
			}
		);

		fetch(req.session?.endpoints?.micropub, {
			method: "POST",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${req.session?.indieauth?.access_token}`,
			},
			body: params,
		})
			.then((response) => {
				if (!response.ok) {
					response
						.json()
						.then((responseData) => {
							logger.log(
								LogLevels.error,
								"Received an error from the Micropub server.",
								{ error: responseData }
							);
						})
						.catch((error) => {
							logger.log(
								LogLevels.error,
								"Received an error from the Micropub server but could not read it.",
								{ error }
							);
							throw new Error(error);
						});
				}

				logger.log(
					LogLevels.http,
					"Received a response from the Micropub server",
					{ response }
				);
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
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Reply",
	}) as PostPageData;

	res.render("publish/reply", pageData);
});

publishRouter.get("/like/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Like",
	}) as PostPageData;

	res.render("publish/like", pageData);
});

publishRouter.get("/repost/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Repost",
	}) as PostPageData;

	res.render("publish/repost", pageData);
});

publishRouter.get("/bookmark/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Bookmark",
	}) as PostPageData;

	res.render("publish/bookmark", pageData);
});

publishRouter.get("/photo/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Photo",
	}) as PostPageData;

	res.render("publish/photo", pageData);
});

publishRouter.get("/video/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Video",
	}) as PostPageData;

	res.render("publish/video", pageData);
});

publishRouter.get("/audio/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Audio",
	}) as PostPageData;

	res.render("publish/audio", pageData);
});

publishRouter.get("/checkin/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Checkin",
	}) as PostPageData;

	res.render("publish/checkin", pageData);
});

publishRouter.get("/event/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "Event",
	}) as PostPageData;

	res.render("publish/event", pageData);
});

publishRouter.get("/rsvp/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: PostPageData = pageDataHelper(req, {
		pageTitle: "RSVP",
	}) as PostPageData;

	res.render("publish/rsvp", pageData);
});

export { publishRouter };
