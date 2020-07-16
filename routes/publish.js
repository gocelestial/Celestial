"use strict";
exports.__esModule = true;
exports.publishRouter = void 0;
var express_1 = require("express");
// Env and other constants
var constants_1 = require("../config/constants");
var publishRouter = express_1.Router();
exports.publishRouter = publishRouter;
// Validate session exists or redirect to login
publishRouter.use(function (err, req, res, next) {
    if (!req.session.data || !req.session.data.me) {
        res.redirect(302, "/login");
    }
    next();
});
publishRouter.get("/article", function (req, res) {
    res.render("publish/article", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Article",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/note", function (req, res) {
    res.render("publish/note", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Note",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/reply", function (req, res) {
    res.render("publish/reply", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Reply",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/like", function (req, res) {
    res.render("publish/like", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Like",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/repost", function (req, res) {
    res.render("publish/repost", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Repost",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/bookmark", function (req, res) {
    res.render("publish/bookmark", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Bookmark",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/photo", function (req, res) {
    res.render("publish/photo", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Photo",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/video", function (req, res) {
    res.render("publish/video", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Video",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/audio", function (req, res) {
    res.render("publish/audio", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Audio",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/checkin", function (req, res) {
    res.render("publish/checkin", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Checkin",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/event", function (req, res) {
    res.render("publish/event", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "Event",
        appState: req.session.appState || "guest"
    });
});
publishRouter.get("/rsvp", function (req, res) {
    res.render("publish/rsvp", {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        pageTitle: "RSVP",
        appState: req.session.appState || "guest"
    });
});
