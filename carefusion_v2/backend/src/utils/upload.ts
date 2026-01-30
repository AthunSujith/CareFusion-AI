import multer from 'multer';
import path from 'path';
import fs from 'fs';

const BASE_DATA_DIR = 'C:\\CareFusion-AI\\data';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { patientId, folderType } = req.body;
        // Default to documentation if no folder type specified
        const type = folderType || 'documentation';
        const dest = path.join(BASE_DATA_DIR, patientId, type);

        // Ensure directory exists
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        // Keep original name but add timestamp to avoid overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

export const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
