const bodyParser = require("body-parser");

// Create parser to read application/x-www-form-urlencoded
// false tells body-parser to use querystring library
// true tells body-parser to use qs library
const urlEncodedParser = bodyParser.urlencoded({
	extended: false,
});

export { urlEncodedParser };
