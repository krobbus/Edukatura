import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import { getUsers, updateUserRole } from '../controllers/userController.js';

const router = express.Router();

router.use(verifyToken, authorizeRoles('admin'));
router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);

export default router;