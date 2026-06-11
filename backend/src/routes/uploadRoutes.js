import { Router } from 'express';
import { uploadProductImages, uploadProfileImage } from '../controllers/uploadController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = Router();

// Development mode: skip auth for uploads
const isDevMode = process.env.NODE_ENV === 'development';

const uploadHandler = isDevMode
  ? upload.array('images', 6)
  : [protect, authorize('admin', 'vendor'), upload.array('images', 6)];

router.post('/products', uploadHandler, uploadProductImages);

const profileUploadHandler = isDevMode
  ? upload.single('image')
  : [protect, upload.single('image')];

router.post('/profile', profileUploadHandler, uploadProfileImage);

export default router;
