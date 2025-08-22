"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeEmail = exports.getUsers = void 0;
const usersModel_1 = __importDefault(require("../models/usersModel"));
const SubscriberEmail_model_1 = __importDefault(require("../models/SubscriberEmail.model"));
/**
 * Returns a list of users with published web content.
 */
const getUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = (yield usersModel_1.default.aggregate([
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
        ]));
        res.status(200).json(users);
    }
    catch (err) {
        next(err);
    }
});
exports.getUsers = getUsers;
/**
 * Subscribes an email if not already present.
 */
const subscribeEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.query;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ message: 'Please provide a valid email address' });
            return;
        }
        const existing = yield SubscriberEmail_model_1.default.findOne({ email });
        if (existing) {
            res.status(409).json({ message: 'Email is already subscribed' });
            return;
        }
        const newSub = new SubscriberEmail_model_1.default({ email });
        yield newSub.save();
        res.status(201).json({
            message: 'Email subscribed successfully',
            email,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.subscribeEmail = subscribeEmail;
