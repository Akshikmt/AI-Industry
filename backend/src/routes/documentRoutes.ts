import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadDocument, getAllDocuments, deleteDocument } from '../controllers/documentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File validation filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Supported formats: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// 1. Upload Document (Restricted to Admins)
router.post('/upload', authenticateToken, requireRole('admin'), upload.single('file'), uploadDocument);

// 2. Get All Documents (Available to both Admin and Employee)
router.get('/', authenticateToken, getAllDocuments);

// 3. Delete Document (Restricted to Admins)
router.delete('/:id', authenticateToken, requireRole('admin'), deleteDocument);

export default router;
