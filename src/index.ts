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
	// This is the service name. Docker resolve this for us if both the services are on the same network.
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
import { LogLevels } from "./enumerator/LogLevels";
import { AppError } from "./interface/AppError";
import { logger } from "./lib/logger";

// Set up a CSP
const directives = {
	defaultSrc: ["'self'"],
	// styleSrc: ["'self'"],
	scriptSrc: ["'self'", "https://twemoji.maxcdn.com/"],
	imgSrc: ["https://twemoji.maxcdn.com/"],
};

// Allow unsafe scripts locally
if (process.env.NODE_ENV === "development")
	directives.scriptSrc.push("'unsafe-eval'");

// Employ the CSP
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

// Set appState for this session
// TODO This feels very hacky. Surely there is a better way to "reload" a session upon a re-visit?
app.use(
	(req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		if (req.session?.isLoggedIn) {
			logger.log(
				LogLevels.verbose,
				"User appears to be already logged in as per our session data. Setting appState to 'User'."
			);
			req.session.appState = AppUserState.User;
		}
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
		userIdentity: req.session?.user?.profileUrl || null,
		error: req.session?.error || null,
	};

	// TODO error to be removed from here - we've set up a dedicated error page.
	// We've consumed the error into the pageData object. Clear it now.
	if (req.session && req.session?.error) req.session.error = null;

	res.render("index", pageData);
});

app.get("/error", (req: ExpressRequest, res: ExpressResponse) => {
	const pageData: DefaultPageData = {
		title: APP_TITLE,
		subtitle: APP_SUBTITLE,
		pageTitle: "An error occured",
		appState: req.session?.appState || AppUserState.Guest,
		userIdentity: req.session?.user?.profileUrl || null,
		error: req.session?.error || null,
	};

	// We've consumed the error into the pageData object. Clear it now.
	if (req.session && req.session?.error) req.session.error = null;

	res.render("error", pageData);
});

app.use("/login/", authRouter);

app.use("/logout/", logoutRouter);

app.use("/publish/", publishRouter);

// Generic error handler
// Currently only handles errors with the code "AppError"
// Rest are passed onto Express' default handler
app.use(
	(
		err: AppError,
		req: ExpressRequest,
		res: ExpressResponse,
		next: ExpressNextFunction
	) => {
		if (err?.code === "AppError") {
			logger.log(LogLevels.error, err.message, {
				user: req.session?.user?.profileUrl,
			});
			if (req.session) req.session.error = err.message;
			res.redirect(302, "/error");
		}
		next(err);
	}
);

app.listen(PORT, (): void => {
	logger.log(LogLevels.info, `Server is listening on ${PORT}`);
});
