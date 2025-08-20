import axios from "axios";
import FormData from "form-data";
import { NextFunction, Request, Response } from "express";

interface MulterRequest extends Request {
    file?: Express.Multer.File;
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
