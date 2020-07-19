// Core
import express, {
	Response as ExpressResponse,
	Request as ExpressRequest,
	NextFunction as ExpressNextFunction,
} from "express";

// Env and other constants
import {
	PORT,
	REDIS_PASSWORD,
	APP_TITLE,
	APP_SUBTITLE,
} from "./config/constants";

// Template engine
import { Liquid } from "liquidjs";

// Middleware imports
const helmet = require("helmet");

// Session and store
const session = require("express-session");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
const redisClient = redis.createClient({
	password: REDIS_PASSWORD,
	host: "redis",
});

// App and app details
const app = express();

// Route imports
import { publishRouter } from "./routes/publish";
import { authRouter } from "./routes/authentication";
import { logoutRouter } from "./routes/logout";

// Our interface and enums
import { DefaultPageData } from "./interface/DefaultPageData";
import { AppUserState } from "./enumerator/AppUserState";

// Set up a CSP
const directives = {
	defaultSrc: ["'self'"],
	// styleSrc: ["'self'"],
	scriptSrc: ["'self'", "https://twemoji.maxcdn.com/"],
	imgSrc: ["https://twemoji.maxcdn.com/"],
};

if (process.env.NODE_ENV === "development")
	directives.scriptSrc.push("'unsafe-eval'");

app.use(
	helmet.contentSecurityPolicy({
		directives,
	})
);

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
		cookie: {
			maxAge: 1000 * 60 * 60 * 24, // 1 day
			sameSite: false,
		},
		// The session store instance, defaults to a new MemoryStore instance.
		store: new RedisStore({
			client: redisClient,
		}),
	})
);

// Set appState is identity available in session
app.use(
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		if (req.session?.validatedUserProfileURL)
			req.session.appState = AppUserState.User;
		next();
	}
);

// Routes
app.get("/", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "Hello! 👋",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.validatedUserProfileURL || null,
		error: req.session?.error || null,
	};

	if (req.session && req.session?.error) req.session.error = null;

	res.render("index", pageData);
});

app.use("/login/", authRouter);

app.use("/logout/", logoutRouter);

app.use("/publish/", publishRouter);

app.listen(PORT, (): void => {
	console.log(`Server is listening on ${PORT}`);
});
