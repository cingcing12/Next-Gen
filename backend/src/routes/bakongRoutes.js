import express from 'express';
import { generateKHQR, checkTransaction } from '../controllers/bakongController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, generateKHQR);
router.post('/check', protect, checkTransaction);

export default router;
