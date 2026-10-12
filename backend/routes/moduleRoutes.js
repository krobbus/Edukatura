import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';
import {
    createModule,
    getModules,
    getModuleById,
    updateModule,
    deleteModule
} from '../controllers/moduleController.js';

const router = express.Router();

router.use(verifyToken);

router.route('/')
    .get(getModules)
    .post(authorizeRoles('instructor', 'admin'), createModule);

router.route('/:id')
    .get(getModuleById)
    .put(authorizeRoles('instructor', 'admin'), updateModule)
    .delete(authorizeRoles('instructor', 'admin'), deleteModule);

export default router;
