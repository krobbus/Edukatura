import asyncHandler from '../utils/asyncHandler.js';
import { Submission } from '../models/index.js';

export const createSubmission = asyncHandler(async (req, res) => {
    const { assignment, submissionText, fileUrl } = req.body;

    const existing = await Submission.findOne({ assignment, student: req.user._id });
    if (existing) {
        res.status(400);
        throw new Error('You already submitted this assignment');
    }

    const submission = await Submission.create({
        assignment,
        student: req.user._id,
        submissionText,
        fileUrl,
        status: 'submitted',
        submittedAt: new Date()
    });

    res.status(201).json(submission);
});

export const getMySubmissions = asyncHandler(async (req, res) => {
    const filter = { student: req.user._id };
    if (req.query.assignment) filter.assignment = req.query.assignment;
    const submissions = await Submission.find(filter).populate('assignment', 'title dueDate maxPoints');

    res.json(submissions);
});

export const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
    if (!req.query.assignment) {
        res.status(400);
        throw new Error('assignment query param is required');
    }

    const submissions = await Submission.find({ assignment: req.query.assignment }).populate('student', 'firstName lastName email');
    res.json(submissions);
});

export const gradeSubmission = asyncHandler(async (req, res) => {
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;

    await submission.save();
    res.json(submission);
});