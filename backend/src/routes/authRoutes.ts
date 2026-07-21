import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { login, getMe, signup, addMember, getMembers, getOrganization, updateOrganization, updateMember, deleteMember, updateProfilePhoto, bulkAddMembers } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const handleFileUpload = (req: any, res: any, next: any) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// Public routes
router.post('/login', login);
router.post('/signup', signup);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/profile/photo', authenticateToken, handleFileUpload, updateProfilePhoto);
router.post('/members', authenticateToken, requireRole('admin'), addMember);
router.post('/members/bulk', authenticateToken, requireRole('admin'), bulkAddMembers);
router.get('/members', authenticateToken, requireRole('admin'), getMembers);
router.put('/members/:id', authenticateToken, requireRole('admin'), updateMember);
router.delete('/members/:id', authenticateToken, requireRole('admin'), deleteMember);
router.get('/organization', authenticateToken, requireRole('admin'), getOrganization);
router.put('/organization', authenticateToken, requireRole('admin'), updateOrganization);

export default router;

