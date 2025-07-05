const allowedOrigins: string[] = [
  "https://si3-backend.vercel.app",
  "https://www.si3.space",
  "https://si3-dashboard.vercel.app",
];

// Add development origins based on environment
if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:8080");
}

// Add additional origins from environment variables
if (process.env.ALLOWED_ORIGINS) {
  const envOrigins: string[] = process.env.ALLOWED_ORIGINS.split(",");

  allowedOrigins.push(...envOrigins);
}

export { allowedOrigins };
