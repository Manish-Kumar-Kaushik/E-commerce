import { Router } from 'express';
import {
  getNotifications,
  getNotificationsCount,
  markAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { mongoIdParamValidator } from '../middleware/validators.js';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/count', getNotificationsCount);
router.patch('/:id/read', mongoIdParamValidator, validate, markAsRead);

export default router;