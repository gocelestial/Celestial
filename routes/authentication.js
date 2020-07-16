"use strict";
exports.__esModule = true;
exports.authRouter = void 0;
var express_1 = require("express");
var node_fetch_1 = require("node-fetch");
var csrfProtection_1 = require("../middleware/csrfProtection");
// Env and other constants
var constants_1 = require("../config/constants");
var authRouter = express_1.Router();
exports.authRouter = authRouter;
authRouter.get("/", csrfProtection_1.csrfProtection, function (req, res) {
    // Is there any error?
    var pageData = {
        title: constants_1.APP_TITLE,
        subtitle: constants_1.APP_SUBTITLE,
        appState: req.session.appState || "guest",
        csrfToken: req.csrfToken(),
        error: null,
        indielogin: constants_1.INDIELOGIN
    };
    console.log("Sending CSRF token " + pageData.csrfToken + " for session ID " + req.session.id);
    if (req.session.error) {
        pageData.error = req.session.error;
        req.session.error = null;
    }
    // Render the login page with a token
    res.render("login", pageData);
});
// Middleware - error handler
authRouter.use(function (err, req, res, next) {
    if (err.code !== "EBADCSRFTOKEN")
        return next(err);
    // handle CSRF token errors here
    req.session.error = "Form tampered with.";
    res.redirect(403, "/login");
});
authRouter.use(function (err, req, res, next) {
    if (err.code !== "ENOTFOUND")
        return next(err);
    req.session.error = "Failed to get identity details from IndieLogin.";
    res.redirect(500, "/login");
});
authRouter.get("/verify/", csrfProtection_1.csrfProtection, function (req, res) {
    // This is where IndieLogin redirect is configured to
    // Check: Have we received a verification code?
    if (req.query.code) {
        var params = new URLSearchParams();
        params.append("code", req.query.code);
        params.append("redirect_uri", constants_1.INDIELOGIN.redirect_uri);
        params.append("client_id", constants_1.INDIELOGIN.client_id);
        // Now send a request to get user website details
        node_fetch_1["default"]("https://indielogin.com/auth", {
            method: "post",
            headers: {
                Accept: "application/json"
            },
            body: params
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
            if (data.me) {
                req.session.data = data;
                res.redirect(302, "/");
                return;
            }
            else {
                throw new Error("An error occured trying to make a call to IndieLogin.");
            }
        })["catch"](function (error) {
            console.log(error);
            req.session.error = error;
            res.redirect(302, "/login");
            return;
        });
    }
    else {
        req.session.error = "No code provided by IndieLogin.";
        res.redirect(302, "/login");
        return;
    }
});
