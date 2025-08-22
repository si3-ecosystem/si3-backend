import axios from "axios";
import FormData from "form-data";
import { NextFunction, Request, Response } from "express";
import UserModel, { IUser } from "../models/usersModel";

interface MulterRequest extends Request {
    file?: Express.Multer.File;
    user?: IUser;
}

export const uploadToPinata = async (
    req: MulterRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }

        // Create FormData with buffer (no file system involved)
        const data = new FormData();
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

        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PINATA_JWT}`,
                    ...data.getHeaders(),
                },
                timeout: 30000,
            }
        );

        const ipfsHash = response.data.IpfsHash;
        const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        res.json({
            success: true,
            url,
            ipfsHash,
            originalName: req.file.originalname,
        });
    } catch (error) {
        console.error("Pinata upload error:", error);
        next(error);
    }
};

export const uploadProfileImage = async (
    req: MulterRequest,
    res: Response,
    next: NextFunction
) => {
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
        const data = new FormData();
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

        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PINATA_JWT}`,
                    ...data.getHeaders(),
                },
                timeout: 30000,
            }
        );

        const ipfsHash = response.data.IpfsHash;
        const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        // Update user's profile image
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user._id,
            {
                profileImage: url,
                settingsUpdatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).select('-__v');

        res.json({
            success: true,
            url,
            ipfsHash,
            originalName: req.file.originalname,
            user: updatedUser,
            message: "Profile image updated successfully",
        });
    } catch (error) {
        console.error("Profile image upload error:", error);
        next(error);
    }
};
