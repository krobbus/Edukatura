import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
} from '../controllers/assignmentController.js';

const router = express.Router();

router.use(verifyToken);

router.route('/')
    .get(getAssignments)
    .post(authorizeRoles('faculty', 'admin'), createAssignment);

router.route('/:id')
    .get(getAssignmentById)
    .put(authorizeRoles('faculty', 'admin'), updateAssignment)
    .delete(authorizeRoles('faculty', 'admin'), deleteAssignment);

export default router;