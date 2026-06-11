import { Router } from 'express';
import {
  getCollectionController,
  getCollectionsController,
} from '../controllers/collectionController.js';

const router = Router();

router.get('/', getCollectionsController);
router.get('/:slug', getCollectionController);

export default router;
