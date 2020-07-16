import { Router } from "express";

// Env and other constants
import { APP_TITLE, APP_SUBTITLE } from "../config/constants";

const publishRouter = Router();

// Validate session exists or redirect to login
publishRouter.use((err, req, res, next) => {
	if (!req.session.data || !req.session.data.me) {
		res.redirect(302, "/login");
	}
	next();
});

publishRouter.get("/article/", (req, res) => {
	res.render("publish/article", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Article",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/note/", (req, res) => {
	res.render("publish/note", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Note",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/reply/", (req, res) => {
	res.render("publish/reply", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Reply",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/like/", (req, res) => {
	res.render("publish/like", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Like",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/repost/", (req, res) => {
	res.render("publish/repost", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Repost",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/bookmark/", (req, res) => {
	res.render("publish/bookmark", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Bookmark",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/photo/", (req, res) => {
	res.render("publish/photo", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Photo",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/video/", (req, res) => {
	res.render("publish/video", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Video",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/audio/", (req, res) => {
	res.render("publish/audio", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Audio",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/checkin/", (req, res) => {
	res.render("publish/checkin", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Checkin",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/event/", (req, res) => {
	res.render("publish/event", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Event",
		appState: req.session.appState || "guest",
	});
});

publishRouter.get("/rsvp/", (req, res) => {
	res.render("publish/rsvp", {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "RSVP",
		appState: req.session.appState || "guest",
	});
});

export { publishRouter };
