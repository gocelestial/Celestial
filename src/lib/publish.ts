import { DateTime } from "luxon";
import { Request as ExpressRequest } from "express";
import { URLSearchParams } from "url";

const deriveDate = (
	date: string,
	time: string,
	userTimezone: string
): string => {
	const [year, month, day] = date.split("-");
	const [hour, minute] = time.split(":");
	// TODO Cleaner API for converting to numbers?
	return DateTime.fromObject({
		year: parseInt(year),
		month: parseInt(month),
		day: parseInt(day),
		hour: parseInt(hour),
		minute: parseInt(minute),
		zone: userTimezone,
	})
		.toUTC()
		.toISO();
};

const prepareParams = (req: ExpressRequest): URLSearchParams => {
	// The date and time we receive are in user's tz
	const published = deriveDate(
		req.body?.date,
		req.body?.time,
		req.session?.user?.timezone
	);

	const params = new URLSearchParams();
	params.append("h", req.body.h);
	params.append("content", req.body.note);
	params.append("published", published.toString());

	// Can be a string, an emtpy string, or an array of string
	if (req.body?.["mp-syndicate-to"] && req.body["mp-syndicate-to"] !== "") {
		if (Array.isArray(req.body["mp-syndicate-to"])) {
			// Is an array
			for (const target of req.body["mp-syndicate-to"]) {
				params.append("mp-syndicate-to[]", target);
			}
		} else {
			// Is a string
			params.append("mp-syndicate-to", req.body["mp-syndicate-to"]);
		}
	}

	return params;
};

export { prepareParams, deriveDate };
