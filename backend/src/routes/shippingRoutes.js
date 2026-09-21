import express from 'express';
import {
  getShippingMethods,
  getActiveShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethod,
} from '../controllers/shippingController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/',       getShippingMethods);          // public (admin list)
router.get('/active', getActiveShippingMethods);    // public (checkout)
router.post('/',      protect, admin, createShippingMethod);
router.put('/:id',    protect, admin, updateShippingMethod);
router.delete('/:id', protect, admin, deleteShippingMethod);
router.patch('/:id/toggle', protect, admin, toggleShippingMethod);

export default router;
