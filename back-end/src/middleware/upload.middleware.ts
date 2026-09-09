import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

// Upload directory — created at startup if absent
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads/avatars";
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req: Request, file, cb) => {
        // Format: avatar-<userId>-<timestamp>.<ext>
        const userId = req.user?.id ?? "unknown";
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `avatar-${userId}-${Date.now()}${ext}`;
        cb(null, filename);
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed."));
    }
};

export const uploadAvatar = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter,
}).single("avatar"); // field name the client must use
