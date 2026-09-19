import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import {
    createClass,
    getClasses,
    getClassById,
    updateClass,
    deleteClass,
} from '../controllers/classController.js';

const router = express.Router();

router.use(verifyToken);

router.route('/')
    .get(getClasses)
    .post(authorizeRoles('faculty', 'admin'), createClass);

router.route('/:id')
    .get(getClassById)
    .put(authorizeRoles('faculty', 'admin'), updateClass)
    .delete(authorizeRoles('faculty', 'admin'), deleteClass);

export default router;