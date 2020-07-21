import { createLogger, format, transports } from "winston";
const { combine, prettyPrint, timestamp } = format;

const logger = createLogger({
	level: process.env.NODE_ENV === "production" ? "info" : "silly",
	format: format.json(),
	defaultMeta: { service: "Splisher" },
	transports: [
		// - Write all logs with level `error` and below to `error.log`
		new transports.File({ filename: "error.log", level: "error" }),
		// - Write all logs with level `info` and below to `combined.log`
		// new transports.File({ filename: "combined.log" }),
	],
});

// If we're not in production then log to the `console` as well
if (process.env.NODE_ENV !== "production") {
	logger.add(
		new transports.Console({
			format: combine(timestamp(), prettyPrint()),
		})
	);
}

export { logger };
