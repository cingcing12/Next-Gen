import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  blockUser,
  verify2FALogin,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  googleAuth,
  adminUpdateUser,
  deleteUser
} from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/verify-2fa', verify2FALogin);

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/wishlist').get(protect, getWishlist).post(protect, addToWishlist);
router.route('/wishlist/:productId').delete(protect, removeFromWishlist);

router.route('/').get(protect, admin, getUsers);
router.route('/:id')
  .put(protect, admin, adminUpdateUser)
  .delete(protect, admin, deleteUser);
router.route('/:id/block').put(protect, admin, blockUser);

export default router;
