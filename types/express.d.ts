
import 'express';
import { IUser } from '../models/usersModel';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
