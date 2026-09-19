import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import {
    createEnrollment,
    getMyEnrollments,
    getEnrollmentsForClass,
    deleteEnrollment
} from '../controllers/enrollmentController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my', getMyEnrollments);

router.route('/')
    .get(getEnrollmentsForClass)
    .post(createEnrollment);

router.delete('/:id', deleteEnrollment);

export default router;