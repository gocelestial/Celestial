// Core
import express, {
	Response as ExpressResponse,
	Request as ExpressRequest,
	NextFunction as ExpressNextFunction,
} from "express";

// Env and other constants
import { PORT, REDIS_PASSWORD } from "./config/constants";

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

const app = express();

// Route imports
import { publishRouter } from "./routes/publish";
import { authRouter } from "./routes/authentication";
import { logoutRouter } from "./routes/logout";

// Our interface, enums, libs, etc.
import { AppUserState } from "./enumerator/AppUserState";
import { LogLevels } from "./enumerator/LogLevels";

import { DefaultPageData, UserPageData } from "./interface/PageData";
import { AppError } from "./interface/AppError";

import { logger } from "./lib/logger";
import { pageDataHelper } from "./lib/pageDataHelper";
import { resetEphemeralSessionData } from "./lib/session";

// Create a CSP
const directives = {
	defaultSrc: ["'self'"],
	scriptSrc: ["'self'", "https://twemoji.maxcdn.com/"],
	imgSrc: ["'self'", "https://rusingh.com", "https://twemoji.maxcdn.com/"],
};

// Allow unsafe scripts locally - required for Webpack output to work
if (process.env.NODE_ENV === "development")
	directives.scriptSrc.push("'unsafe-eval'");

// Employ a CSP
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
// https://www.npmjs.com/package/express-session
app.use(
	session({
		secret: "indie-aww",
		saveUninitialized: false,
		resave: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24, // 1 day
			sameSite: false,
		},
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
	let pageData: DefaultPageData | UserPageData;
	if (req.session?.appState === AppUserState.User) {
		pageData = pageDataHelper(req, {
			pageTitle: "Hello! 👋",
		}) as DefaultPageData;
	} else {
		pageData = pageDataHelper(req, {
			pageTitle: "Hello! 👋",
		}) as UserPageData;
	}

	res.render("index", pageData);
});

app.get("/error", (req: ExpressRequest, res: ExpressResponse) => {
	let pageData: DefaultPageData | UserPageData;
	if (req.session?.appState === AppUserState.User) {
		pageData = pageDataHelper(req, {
			pageTitle: "Error",
		}) as DefaultPageData;
	} else {
		pageData = pageDataHelper(req, {
			pageTitle: "Error",
		}) as UserPageData;
	}

	resetEphemeralSessionData(req, ["error"]);

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
			resetEphemeralSessionData(req, ["error"]);
			res.redirect(302, "/error");
		}
		next(err);
	}
);

app.listen(PORT, (): void => {
	logger.log(LogLevels.info, `Server is listening on ${PORT}`);
});
