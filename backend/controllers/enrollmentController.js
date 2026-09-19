import asyncHandler from '../utils/asyncHandler.js';
import { Enrollment } from '../models/index.js';

export const createEnrollment = asyncHandler(async (req, res) => {
    const classId = req.body.class ?? req.body.classId;

    const existing = await Enrollment.findOne({ class: classId, student: req.user._id });
    if (existing) {
        res.status(400);
        throw new Error('Already enrolled in this class');
    }

    const enrollment = await Enrollment.create({ class: classId, student: req.user._id });
    res.status(201).json(enrollment);
});

export const getMyEnrollments = asyncHandler(async (req, res) => {
    const enrollments = await Enrollment.find({ student: req.user._id }).populate('class', 'classCode title');
    res.json(enrollments);
});

export const getEnrollmentsForClass = asyncHandler(async (req, res) => {
    if (!req.query.class) {
        res.status(400);
        throw new Error('class query param is required');
    }

    const enrollments = await Enrollment.find({ class: req.query.class }).populate('student', 'firstName lastName email');
    res.json(enrollments);
});

export const deleteEnrollment = asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
        res.status(404);
        throw new Error('Enrollment not found');
    }

    const isOwner = enrollment.student.toString() === req.user._id.toString();
    const isStaff = ['faculty', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaff) {
        res.status(403);
        throw new Error('Not authorized to remove this enrollment');
    }

    await enrollment.deleteOne();
    res.json({ message: 'Enrollment removed' });
});