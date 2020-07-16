"use strict";
exports.__esModule = true;
exports.csrfProtection = void 0;
var csrf = require("csurf");
// Middleware to generate a CSRF token and make it available on req object
var csrfProtection = csrf({ cookie: false });
exports.csrfProtection = csrfProtection;
