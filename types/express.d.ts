import { IUser } from "../models/usersModel";
import { IEventCache } from "../models/rsvpModels";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      event?: IEventCache;
    }
  }
}

export {};
