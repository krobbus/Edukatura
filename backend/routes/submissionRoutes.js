import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import {
    createSubmission,
    getMySubmissions,
    getSubmissionsForAssignment,
    gradeSubmission
} from '../controllers/submissionController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my', getMySubmissions);

router.route('/')
    .get(authorizeRoles('faculty', 'admin'), getSubmissionsForAssignment)
    .post(createSubmission);

router.put('/:id/grade', authorizeRoles('faculty', 'admin'), gradeSubmission);

export default router;