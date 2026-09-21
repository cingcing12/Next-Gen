import express from 'express';
import { streamSystem, getSystemConfig, updateSystemConfig } from '../controllers/systemController.js';

import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/config').get(getSystemConfig).put(protect, admin, updateSystemConfig);
router.route('/stream').get(streamSystem);

export default router;
