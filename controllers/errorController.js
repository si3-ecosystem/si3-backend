import AppError from "../utils/AppError.js";

// Mongoose: invalid _id format
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Mongoose: duplicate key
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];

  const message = `Duplicate field value: "${value}" for field "${field}". Please use another value.`;
  return new AppError(message, 400);
};

// Mongoose: validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(" ")}`;
  return new AppError(message, 400);
};

// JWT: malformed token
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

// JWT: expired token
const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Log unexpected errors internally
  console.error("💥 UNEXPECTED ERROR:", err);

  // Send generic message to client
  res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    // Ensure essential properties aren't lost in shallow copy
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;

    // Handle specific known error types
    if (error.name === "CastError") error = handleCastErrorDB(error);
    else if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    else if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    else if (error.name === "JsonWebTokenError") error = handleJWTError();
    else if (error.name === "TokenExpiredError")
      error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
