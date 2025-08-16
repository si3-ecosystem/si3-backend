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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromFileStorage = exports.uploadToFileStorage = void 0;
// Assert environment variables
const PINATA_AUTH_TOKEN = process.env.PINATA_AUTH_TOKEN;
const PINATA_URL = process.env.PINATA_URL;
/**
 * Uploads a file to Pinata (IPFS) and returns the resulting IPFS hash.
 * @param file - instance of File from formdata-node
 * @returns IPFS hash string
 */
const uploadToFileStorage = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formData = new FormData();
        // Cast File to Blob to satisfy FormData API
        formData.append('file', file, file.name);
        const response = yield fetch(PINATA_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
            },
            body: formData,
        });
        const responseJson = yield response.json();
        if (!response.ok) {
            throw new Error((responseJson === null || responseJson === void 0 ? void 0 : responseJson.error) || 'Upload failed');
        }
        return responseJson.IpfsHash;
    }
    catch (error) {
        console.error('Error in uploadToFileStorage:', error);
        throw error;
    }
});
exports.uploadToFileStorage = uploadToFileStorage;
/**
 * Deletes a file from Pinata (IPFS) by its CID.
 * @param cid - content identifier (IPFS hash)
 */
const deleteFromFileStorage = (cid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
            method: 'DELETE',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
            },
        });
        if (!response.ok) {
            const errorJson = yield response.json();
            throw new Error((errorJson === null || errorJson === void 0 ? void 0 : errorJson.error) || 'Delete failed');
        }
    }
    catch (error) {
        console.error('Error in deleteFromFileStorage:', error);
        throw error;
    }
});
exports.deleteFromFileStorage = deleteFromFileStorage;
