const csrf = require("csurf");

// Middleware to generate a CSRF token and make it available on req object
const csrfProtection = csrf({ cookie: false });

export { csrfProtection };