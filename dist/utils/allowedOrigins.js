"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedOrigins = void 0;
const allowedOrigins = [
    // Production origins
    "https://si3.space",
    "https://www.si3.space",
    "https://app.si3.space",
    "https://api.si3.space",
    "https://si3-backend-one.vercel.app",
    "https://si3-dashboard-nine.vercel.app",
];
exports.allowedOrigins = allowedOrigins;
// Add development origins based on environment
if (process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV !== "production") {
    const devOrigins = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
    ];
    allowedOrigins.push(...devOrigins);
}
// Add Vercel deployment URL from environment variable
if (process.env.VERCEL_URL) {
    const vercelUrl = `https://${process.env.VERCEL_URL}`;
    allowedOrigins.push(vercelUrl);
}
// Add additional origins from environment variables
if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
    allowedOrigins.push(...envOrigins);
}
