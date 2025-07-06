import { Request, Response, NextFunction } from "express";

/**
 * Async error handler wrapper
 * Eliminates the need for try-catch blocks in async route handlers
 *
 * @param fn - Async function to wrap
 * @returns Express middleware function
 *
 * @example
 * // Instead of:
 * app.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // Use:
 * app.get('/users', catchAsync(async (req, res, next) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */

const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
