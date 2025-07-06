import { Request, Response, NextFunction } from "express";

import AppError from "../utils/AppError";

// Error interfaces
interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
  path?: string;
  value?: any;
}

interface JWTError extends Error {
  name: "JsonWebTokenError" | "TokenExpiredError";
}

// Handle MongoDB cast errors (invalid ObjectId, etc.)
const handleCastError = (err: MongoError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return AppError.badRequest(message);
};

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (err: MongoError): AppError => {
  const field = Object.keys(err.keyValue || {})[0] || "field";
  const value = Object.values(err.keyValue || {})[0] || "value";
  const message = `${field} '${value}' already exists. Please use a different ${field}.`;

  return AppError.conflict(message);
};

// Handle MongoDB validation errors
const handleValidationError = (err: MongoError): AppError => {
  const errors = Object.values(err.errors || {}).map(
    (error: any) => error.message
  );
  const message = `Invalid input data: ${errors.join(", ")}`;
  return AppError.validationError(message, errors);
};

// Handle JWT errors
const handleJWTError = (err: JWTError): AppError => {
  if (err.name === "TokenExpiredError") {
    return AppError.unauthorized(
      "Your session has expired. Please log in again."
    );
  }
  return AppError.unauthorized(
    "Invalid authentication token. Please log in again."
  );
};

// Send detailed error in development
const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  console.error("ERROR 💥", err);

  res.status(err.statusCode).json({
    status: err.status,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      timestamp: err.timestamp,
      stack: err.stack,
      ...((err as any).details && { details: (err as any).details }),
    },
  });
};

// Send limited error info in production
const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  // Operational errors: safe to send to client
  if (err.isOperational) {
    res.status(err.statusCode).json(err.toJSON());
  } else {
    // Programming errors: don't leak details

    res.status(500).json({
      status: "error",
      error: {
        message: "Something went wrong!",
        statusCode: 500,
        errorCode: "INTERNAL_SERVER_ERROR",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Global error handling middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert known errors to AppError
  if (err.name === "CastError") {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === "ValidationError") {
    error = handleValidationError(err);
  } else if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    error = handleJWTError(err);
  } else if (!(err instanceof AppError)) {
    // Convert unknown errors to AppError
    error = new AppError(
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong!",
      err.statusCode || 500,
      "INTERNAL_SERVER_ERROR"
    );
  }

  // Send appropriate response
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// 404 handler for unmatched routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  next(AppError.notFound(message));
};

// Validation middleware helper
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = fields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      const message = `Missing required fields: ${missingFields.join(", ")}`;
      return next(AppError.badRequest(message));
    }

    next();
  };
};

// Async validation helper
export const validateAsync = (
  validationFn: (data: any) => Promise<boolean | string>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await validationFn(req.body);

      if (result === true) {
        next();
      } else {
        next(
          AppError.badRequest(
            typeof result === "string" ? result : "Validation failed"
          )
        );
      }
    } catch (error) {
      next(error);
    }
  };
};
