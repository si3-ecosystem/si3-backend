"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.default = catchAsync;
