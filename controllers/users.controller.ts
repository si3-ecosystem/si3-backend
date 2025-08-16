// src/controllers/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import UserModel, { IUser } from '../models/usersModel';
import SubscriberEmail, { ISubscriberEmail } from '../models/SubscriberEmail.model';

/**
 * Returns a list of users with published web content.
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = (await UserModel.aggregate([
      { $match: { password: { $ne: null } } },
      {
        $lookup: {
          from: 'web_contents',
          localField: '_id',
          foreignField: 'user',
          as: 'webContent',
        },
      },
      { $unwind: { path: '$webContent', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          domain: { $exists: true, $ne: null },
          'webContent.landing.image': { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          _id: 1,
          domain: { $concat: ['$domain', '.siher.eth.link'] },
          fullName: '$webContent.landing.fullName',
          image: '$webContent.landing.image',
        },
      },
    ])) as Array<{ _id: mongoose.Types.ObjectId; domain: string; fullName: string; image: string }>;

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * Subscribes an email if not already present.
 */
export const subscribeEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.query as { email?: string };
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Please provide a valid email address' });
      return;
    }

    const existing: ISubscriberEmail | null = await SubscriberEmail.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email is already subscribed' });
      return;
    }

    const newSub: ISubscriberEmail = new SubscriberEmail({ email });
    await newSub.save();

    res.status(201).json({
      message: 'Email subscribed successfully',
      email,
    });
  } catch (err) {
    next(err);
  }
};
