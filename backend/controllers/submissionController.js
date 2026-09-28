import asyncHandler from '../utils/asyncHandler.js';
import { Submission } from '../models/index.js';

export const createSubmission = asyncHandler(async (req, res) => {
    const { assignment, quiz, submissionText, fileUrl, answers } = req.body;

    if (!assignment && !quiz) {
        res.status(400);
        throw new Error('assignment or quiz is required');
    }

    const existing = await Submission.findOne(
        quiz
            ? { quiz, student: req.user._id }
            : { assignment, student: req.user._id }
    );
    if (existing) {
        res.status(400);
        throw new Error(`You already submitted this ${quiz ? 'quiz' : 'assignment'}`);
    }

    const submission = await Submission.create({
        ...(quiz ? { quiz, answers } : { assignment, submissionText, fileUrl }),
        student: req.user._id,
        status: 'submitted',
        submittedAt: new Date(),
    });

    res.status(201).json(submission);
});

export const getMySubmissions = asyncHandler(async (req, res) => {
    const filter = { student: req.user._id };
    if (req.query.quiz) filter.quiz = req.query.quiz;
    else if (req.query.assignment) filter.assignment = req.query.assignment;

    const submissions = await Submission.find(filter)
        .populate('assignment', 'title dueDate maxPoints')
        .populate('quiz', 'title dueDate maxPoints');

    res.json(submissions);
});

export const getSubmissionsForCoursework = asyncHandler(async (req, res) => {
    const { quiz, assignment } = req.query;
    if (!quiz && !assignment) {
        res.status(400);
        throw new Error('assignment or quiz query param is required');
    }

    const filter = quiz ? { quiz } : { assignment };
    const submissions = await Submission.find(filter).populate('student', 'firstName lastName email');
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