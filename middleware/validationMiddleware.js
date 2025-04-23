import { validationResult } from "express-validator";

import AppError from "../utils/AppError.js";

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  next();
};

export default validationMiddleware;
