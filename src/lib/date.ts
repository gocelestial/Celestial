import { utcToZonedTime, zonedTimeToUtc, format } from "date-fns-tz";
// import { parseISO } from "date-fns";

// const prepareDate = (date: Date | string): Date => {
// 	if (typeof date === "string") return parseISO(date);
// 	else if (date instanceof Date) return date;
// return date;
// };

const utcToUserTimezone = (
	date: Date,
	tz: string,
	formatAs?: string
): Date | string => {
	if (formatAs) return format(date, formatAs);
	return utcToZonedTime(date, tz);
};

const userTimezoneToUtc = (
	date: Date,
	tz: string,
	formatAs?: string
): Date | string => {
	if (formatAs) return format(date, formatAs);
	return zonedTimeToUtc(date, tz);
};

export { utcToUserTimezone, userTimezoneToUtc };
