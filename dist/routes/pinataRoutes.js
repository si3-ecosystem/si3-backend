"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const pinataController_1 = require("../controllers/pinataController");
const protectMiddleware_1 = require("../middleware/protectMiddleware");
const router = express_1.default.Router();
// Use memory storage instead of disk storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Files stored in memory as Buffer
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// @ts-ignore
router.post("/upload", upload.single("image"), pinataController_1.uploadToPinata);
// @ts-ignore
router.post("/upload-profile-image", protectMiddleware_1.protect, upload.single("image"), pinataController_1.uploadProfileImage);
exports.default = router;
