import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

import AppError from "../utils/AppError";

// Validation result handler middleware
const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);

    return next(
      AppError.validationError(
        `Validation failed: ${errorMessages.join(", ")}`,
        errorMessages
      )
    );
  }

  next();
};

export default validationMiddleware;
