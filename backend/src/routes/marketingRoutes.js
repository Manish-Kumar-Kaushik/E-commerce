import { Router } from 'express';
import {
  sendContactMessage,
  subscribeNewsletter,
} from '../controllers/marketingController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { contactValidator, newsletterValidator } from '../middleware/validators.js';

const router = Router();

router.post('/newsletter', newsletterValidator, validate, subscribeNewsletter);
router.post('/contact', contactValidator, validate, sendContactMessage);

export default router;
