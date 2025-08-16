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
exports.registerSubdomain = exports.publishDomain = void 0;
// src/controllers/domain.controller.ts
const axios_1 = __importDefault(require("axios"));
const usersModel_1 = __importDefault(require("../models/usersModel"));
const WebContent_model_1 = __importDefault(require("../models/WebContent.model"));
// Environment variables (asserted non-null)
const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY;
const NAMESTONE_API_URL = process.env.NAMESTONE_API_URL;
const ADDRESS = process.env.ADDRESS;
const DOMAIN = process.env.DOMAIN;
const errorResponse = (res, status, message) => res.status(status).json({ message });
const publishDomain = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.user) {
            return errorResponse(res, 401, 'Authentication required');
        }
        const { domain } = req.body;
        if (!domain) {
            return errorResponse(res, 400, 'Domain is required.');
        }
        // Check if subdomain is already taken
        const existingUser = yield usersModel_1.default.findOne({ domain }).exec();
        if (existingUser) {
            return errorResponse(res, 400, 'Subdomain already registered.');
        }
        // Ensure content is published
        const webpage = yield WebContent_model_1.default.findOne({ user: req.user._id }).exec();
        const cid = (_a = webpage === null || webpage === void 0 ? void 0 : webpage.contentHash) !== null && _a !== void 0 ? _a : '';
        if (!cid) {
            console.log('[publishDomain] No content hash found for user:', req.user._id);
            return errorResponse(res, 400, 'Before selecting your domain name, please publish your webpage first.');
        }
        // Register subdomain on external service
        const success = yield (0, exports.registerSubdomain)(domain, cid);
        if (!success) {
            return errorResponse(res, 400, 'Could not register subdomain.');
        }
        // Update user record
        const updatedUser = yield usersModel_1.default.findByIdAndUpdate(req.user._id, { domain }, { new: true }).exec();
        if (!updatedUser) {
            return errorResponse(res, 404, 'User not found.');
        }
        return res
            .status(200)
            .json({ domain: `${updatedUser.domain}.siher.eth.link` });
    }
    catch (error) {
        console.error('[publishDomain] Error:', error);
        return errorResponse(res, 500, (_b = error.message) !== null && _b !== void 0 ? _b : 'Failed to publish domain');
    }
});
exports.publishDomain = publishDomain;
/**
 * Registers a subdomain via the Namestone API.
 * @param subdomain - chosen subdomain
 * @param contenthash - IPFS content hash (without protocol)
 * @returns true if registration succeeded, false otherwise
 */
const registerSubdomain = (subdomain, contenthash) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('[registerSubdomain] Registering subdomain:', subdomain, 'with contenthash:', contenthash);
        const response = yield axios_1.default.post(NAMESTONE_API_URL, {
            domain: DOMAIN,
            address: ADDRESS,
            contenthash: `ipfs://${contenthash}`,
            name: subdomain,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: NAMESTONE_API_KEY,
            },
        });
        console.log('[registerSubdomain] API response status:', response.status);
        return response.status === 200;
    }
    catch (err) {
        console.error('[registerSubdomain] Error registering subdomain:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        return false;
    }
});
exports.registerSubdomain = registerSubdomain;
