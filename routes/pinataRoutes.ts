import express from "express";
import multer from "multer";
import { uploadToPinata } from "../controllers/pinataController";

const router = express.Router();
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post("/upload", upload.single("image"), uploadToPinata);

export default router;