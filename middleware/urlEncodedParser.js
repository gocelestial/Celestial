"use strict";
exports.__esModule = true;
exports.urlEncodedParser = void 0;
var bodyParser = require("body-parser");
// Create parser to read application/x-www-form-urlencoded
// false tells body-parser to use querystring library
// true tells body-parser to use qs library
var urlEncodedParser = bodyParser.urlencoded({
    extended: false
});
exports.urlEncodedParser = urlEncodedParser;
