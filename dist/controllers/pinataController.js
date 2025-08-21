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
exports.uploadProfileImage = exports.uploadToPinata = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const usersModel_1 = __importDefault(require("../models/usersModel"));
const uploadToPinata = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }
        // Create FormData with buffer (no file system involved)
        const data = new form_data_1.default();
        data.append("file", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        // Optional metadata
        const metadata = JSON.stringify({
            name: req.file.originalname,
            keyvalues: {
                uploadedAt: new Date().toISOString(),
            },
        });
        data.append("pinataMetadata", metadata);
        const response = yield axios_1.default.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
            headers: Object.assign({ Authorization: `Bearer ${process.env.PINATA_JWT}` }, data.getHeaders()),
            timeout: 30000,
        });
        const ipfsHash = response.data.IpfsHash;
        const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        res.json({
            success: true,
            url,
            ipfsHash,
            originalName: req.file.originalname,
        });
    }
    catch (error) {
        console.error("Pinata upload error:", error);
        next(error);
    }
});
exports.uploadToPinata = uploadToPinata;
const uploadProfileImage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // Create FormData with buffer (no file system involved)
        const data = new form_data_1.default();
        data.append("file", req.file.buffer, {
            filename: `profile_${req.user._id}_${Date.now()}_${req.file.originalname}`,
            contentType: req.file.mimetype,
        });
        // Optional metadata
        const metadata = JSON.stringify({
            name: `Profile image for user ${req.user._id}`,
            keyvalues: {
                uploadedAt: new Date().toISOString(),
                userId: req.user._id.toString(),
                type: "profile_image",
            },
        });
        data.append("pinataMetadata", metadata);
        const response = yield axios_1.default.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
            headers: Object.assign({ Authorization: `Bearer ${process.env.PINATA_JWT}` }, data.getHeaders()),
            timeout: 30000,
        });
        const ipfsHash = response.data.IpfsHash;
        const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        // Update user's profile image
        const updatedUser = yield usersModel_1.default.findByIdAndUpdate(req.user._id, {
            profileImage: url,
            settingsUpdatedAt: new Date()
        }, { new: true, runValidators: true }).select('-__v');
        res.json({
            success: true,
            url,
            ipfsHash,
            originalName: req.file.originalname,
            user: updatedUser,
            message: "Profile image updated successfully",
        });
    }
    catch (error) {
        console.error("Profile image upload error:", error);
        next(error);
    }
});
exports.uploadProfileImage = uploadProfileImage;
