import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  streamProducts,
  trackCart,
  untrackCart,
  getProductAnalyticsDetails,
} from '../controllers/productController.js';
import { protect, admin, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/stream').get(streamProducts);
router.route('/').get(getProducts).post(protect, admin, createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id/track-cart').post(optionalAuth, trackCart);
router.route('/:id/untrack-cart').post(optionalAuth, untrackCart);
router.route('/:id/analytics-details').get(protect, admin, getProductAnalyticsDetails);

export default router;
