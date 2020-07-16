// Core
const express = require("express");

// Env
import { PORT, REDIS_PASSWORD } from "./config/constants";

// Template engine
import { Liquid } from "liquidjs";

// Middleware
const helmet = require("helmet");
const csrf = require("csurf");
const bodyParser = require("body-parser");

// Session and store
const session = require("express-session");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
const redisClient = redis.createClient({
	password: REDIS_PASSWORD,
	host: "redis",
});

// Misc
import fetch from "node-fetch";

// App and app details
const app = express();
let appState = "guest";
const title: String = "Splisher";
const subtitle: String = "A micropub client";
const indielogin: { auth: string; client_id: string; redirect_uri: string } = {
	auth: "https://indielogin.com/auth",
	client_id: "http://localhost:4000/",
	redirect_uri: "http://localhost:4000/login/verify/",
};

// Set up a CSP
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "https://twemoji.maxcdn.com/"],
			imgSrc: ["https://twemoji.maxcdn.com/"],
		},
	})
);

// Create parser to read application/x-www-form-urlencoded
// false tells body-parser to use querystring library
// true tells body-parser to use qs library
const urlEncodedParser = bodyParser.urlencoded({
	extended: false,
});

// Setup liquid and views
const engine = new Liquid({
	root: __dirname,
	extname: ".liquid",
});
app.engine("liquid", engine.express());
app.set("views", ["./views", "./templates", "./includes"]);
app.set("view engine", "liquid");

// Let Express server assets - CSS, images, etc.
app.use(express.static("assets"));

// Create a session for every request
app.use(
	session({
		// This is the secret used to sign the session ID cookie. This can be either a string for a single secret, or an array of multiple secrets. If an array of secrets is provided, only the first element will be used to sign the session ID cookie, while all the elements will be considered when verifying the signature in requests.
		secret: "indie-aww",
		// Forces a session that is “uninitialized” to be saved to the store. A session is uninitialized when it is new but not modified. Choosing false is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing false will also help with race conditions where a client makes multiple parallel requests without a session.
		saveUninitialized: false,
		// How do I know if this is necessary for my store? The best way to know is to check with your store if it implements the touch method. If it does, then you can safely set resave: false. If it does not implement the touch method and your store sets an expiration date on stored sessions, then you likely need resave: true.
		resave: false,
		// Settings object for the session ID cookie. The default value is { path: '/', httpOnly: true, secure: false, maxAge: null }.
		cookie: {},
		// The session store instance, defaults to a new MemoryStore instance.
		store: new RedisStore({
			client: redisClient,
		}),
	})
);

// Middleware to generate a CSRF token and make it available on req object
const csrfProtection = csrf({ cookie: false });

app.use((req, res, next) => {
	if (req.session.data && req.session.data.me) appState = "user";
	next();
});

// Routes
app.get("/", (req, res) => {
	res.render("index", {
		title,
		subtitle,
		appState,
		userIdentity:
			req.session.data && req.session.data.me
				? req.session.data.me
				: null,
	});
});

app.get("/login", csrfProtection, (req, res) => {
	// Is there any error?
	const pageData = {
		title,
		subtitle,
		appState,
		csrfToken: req.csrfToken(),
		error: null,
		indielogin,
	};

	console.log(
		`Sending CSRF token ${pageData.csrfToken} for session ID ${req.session.id}`
	);

	if (req.session.error) {
		pageData.error = req.session.error;
		req.session.error = null;
	}

	// Render the login page with a token
	res.render("login", pageData);
});

// Middleware - error handler
app.use(function (err, req, res, next) {
	if (err.code !== "EBADCSRFTOKEN") return next(err);

	// handle CSRF token errors here
	req.session.error = "Form tampered with.";
	res.redirect(403, "/login");
});

app.get("/login/verify/", csrfProtection, (req, res) => {
	// This is where IndieLogin redirect is configured to

	// Check: Have we received a verification code?
	if (req.query.code) {
		const params = new URLSearchParams();
		params.append("code", req.query.code);
		params.append("redirect_uri", indielogin.redirect_uri);
		params.append("client_id", indielogin.client_id);

		// Now send a request to get user website details
		fetch("https://indielogin.com/auth", {
			method: "post",
			headers: {
				Accept: "application/json",
			},
			body: params,
		})
			.then((response) => response.json())
			.then((data: { me: string }) => {
				if (data.me) {
					req.session.data = data;
					res.redirect(302, "/");
					return;
				} else {
					throw new Error(
						"An error occured trying to make a call to IndieLogin."
					);
				}
			})
			.catch((error) => {
				console.log(error);
				req.session.error = error;
				res.redirect(302, "/login");
				return;
			});
	} else {
		req.session.error = "No code provided by IndieLogin.";
		res.redirect(302, "/login");
		return;
	}
});

// Middleware to protect routes
app.use((req, res, next) => {
	if (!req.session || (!req.session.data && !req.session.data.me)) {
		next(new Error("not logged in or invalid code."));
	}
	next();
});

// app.get("/dashboard", (req, res) => {
// 	res.render("dashboard", {
// 		title,
// 		subtitle,
// 		appState,
// 		userIdentity: req.session.data.me,
// 	});
// });

app.listen(PORT, (): void => {
	console.log(`Server is listening on ${PORT}`);
});
