import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { register, login, getMe } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

export default router;