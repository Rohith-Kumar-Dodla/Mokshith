import express from 'express';
import * as controller from './review.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { addReviewSchema } from './review.validation.js';
import { requireFeatureEnabled } from '../../middlewares/featureGuard.middleware.js';

const router = express.Router();

router.post('/', protect, requireFeatureEnabled('reviews', 'Reviews are currently disabled.'), validate(addReviewSchema), controller.addReview);

router.get('/:productId', controller.getReviews);

export default router;