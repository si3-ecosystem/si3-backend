import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { NextFunction, Request, Response } from "express";

export const uploadToPinata = async (
    req: Request & { file?: any },
    res: Response,
    next: NextFunction
) => {
    try {
        const filePath = req.file.path;

        // Create FormData
        const data = new FormData();
        data.append("file", fs.createReadStream(filePath));

        // Pinata upload
        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PINATA_JWT}`,
                    ...data.getHeaders(),
                },
            }
        );

        // Remove local file
        fs.unlinkSync(filePath);

        const ipfsHash = response.data.IpfsHash;
        const url = `https://silver-causal-rodent-516.mypinata.cloud/ipfs/${ipfsHash}`;

        res.json({ success: true, url });
    } catch (error) {
        next(error);
    }
};
