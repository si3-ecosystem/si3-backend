class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errorCode: string;
  public timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string = "UNKNOWN_ERROR"
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  // Static helper methods for common errors
  static badRequest(message: string = "Bad Request"): AppError {
    return new AppError(message, 400, "BAD_REQUEST");
  }

  static unauthorized(message: string = "Unauthorized"): AppError {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string = "Forbidden"): AppError {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message: string = "Not Found"): AppError {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static conflict(message: string = "Conflict"): AppError {
    return new AppError(message, 409, "CONFLICT");
  }

  static validationError(
    message: string = "Validation Error",
    details?: any
  ): AppError {
    const error = new AppError(message, 422, "VALIDATION_ERROR");
    if (details) {
      (error as any).details = details;
    }
    return error;
  }

  static tooManyRequests(message: string = "Too Many Requests"): AppError {
    return new AppError(message, 429, "TOO_MANY_REQUESTS");
  }

  static internalServerError(
    message: string = "Internal Server Error"
  ): AppError {
    return new AppError(message, 500, "INTERNAL_SERVER_ERROR");
  }

  // Convert to JSON for consistent API responses
  toJSON() {
    return {
      status: this.status,
      error: {
        message: this.message,
        statusCode: this.statusCode,
        errorCode: this.errorCode,
        timestamp: this.timestamp,
        ...((this as any).details && { details: (this as any).details }),
      },
    };
  }
}

export default AppError;
