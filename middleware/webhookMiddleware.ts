import { Request, Response, NextFunction } from "express";

export const validateUnlockWebhook = (req: Request, res: Response, next: NextFunction): void => {
  // Add any webhook validation logic here if needed
  // For now, just pass through
  next();
};