import express from "express";
import multer from "multer";
import { uploadToPinata, uploadProfileImage } from "../controllers/pinataController";
import { protect } from "../middleware/protectMiddleware";

const router = express.Router();

// Use memory storage instead of disk storage
const upload = multer({ 
  storage: multer.memoryStorage(), // Files stored in memory as Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @ts-ignore
router.post("/upload", upload.single("image"), uploadToPinata);

// @ts-ignore
router.post("/upload-profile-image", protect, upload.single("image"), uploadProfileImage);

export default router;