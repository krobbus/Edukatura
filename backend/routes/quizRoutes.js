import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
} from '../controllers/quizController.js';

const router = express.Router();

router.use(verifyToken);

router.route('/')
    .get(getQuizzes)
    .post(authorizeRoles('instructor', 'admin'), createQuiz);

router.route('/:id')
    .get(getQuizById)
    .put(authorizeRoles('instructor', 'admin'), updateQuiz)
    .delete(authorizeRoles('instructor', 'admin'), deleteQuiz);

export default router;
