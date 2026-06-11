import { Router } from 'express';
import { addAddress, getProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateProfileValidator, addAddressValidator } from '../middleware/validators.js';

const router = Router();

router.use(protect);

router.get('/profile', getProfile);
router.post('/profile', updateProfile);
router.put('/profile', updateProfileValidator, validate, updateProfile);
router.post('/addresses', addAddressValidator, validate, addAddress);

export default router;
