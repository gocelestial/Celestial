import {
	Router,
	Request as ExpressRequest,
	Response as ExpressResponse,
	NextFunction as ExpressNextFunction,
} from "express";
import fetch from "node-fetch";
import { DateTime } from "luxon";
// import getType from "post-type-discovery";

// Our interface, enums, middleware, libs
import { PostPageData } from "../interface/PageData";

import { urlEncodedParser } from "../middleware/urlEncodedParser";

import { LogLevels } from "../enumerator/LogLevels";
import { FormEncoding } from "../enumerator/FormEncoding";

import { pageDataHelper } from "../lib/helpers";
import { resetEphemeralSessionData } from "../lib/session";
import { logger } from "../lib/logger";
import { prepareParams } from "../lib/publish";

const publishRouter = Router();

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

// Common publishing endpoint
publishRouter.post(
	"/publish/",
	urlEncodedParser,
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		logger.log(LogLevels.http, "Received a publishing request.", {
			body: req.body,
		});

		let requestOptions: object;
		switch (req.session?.user?.preferences?.publishingType) {
			case FormEncoding.URLEncoded:
			default:
				const params = prepareParams(req);

				req.body;

				logger.log(
					LogLevels.verbose,
					"Sending publish request to your Micropub server.",
					{
						encoding: FormEncoding.URLEncoded,
						h: params.get("h"),
						content: params.get("content"),
						published: params.get("published"),
						"mp-syndicate-to": params.getAll("mp-syndicate-to[]"),
					}
				);

				requestOptions = {
					method: "POST",
					headers: {
						Accept: "application/json",
						Authorization: `Bearer ${req.session?.indieauth?.access_token}`,
					},
					body: params,
				};
		}

		fetch(req.session?.endpoints?.micropub, requestOptions)
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
							next({
								code: "MicropubServerError",
								message: `${responseData.error} ${responseData?.error_description}`,
							});
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
				// TODO Set shortlinks and syndication links, show them to the user
				// https://www.w3.org/TR/2017/REC-micropub-20170523/#response-p-5
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

export { publishRouter };
