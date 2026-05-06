import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 🔥 Ensure we save to the EXACT SAME root uploads folder being served
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Auto-create folder if missing (failsafe)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 🔥 Remove timestamp prefix if the user wants clean paths, 
    // but usually it's better to keep it to avoid collisions.
    // However, to match the user's expected DB format, I'll keep it simple.
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });