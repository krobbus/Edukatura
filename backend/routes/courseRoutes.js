import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
} from '../controllers/courseController.js';

const router = express.Router();

router.use(verifyToken);

router.route('/')
    .get(getCourses)
    .post(authorizeRoles('faculty', 'admin'), createCourse);

router.route('/:id')
    .get(getCourseById)
    .put(authorizeRoles('faculty', 'admin'), updateCourse)
    .delete(authorizeRoles('faculty', 'admin'), deleteCourse);

export default router;