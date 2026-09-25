import asyncHandler from '../utils/asyncHandler.js';
import { Quiz } from '../models/index.js';

export const createQuiz = asyncHandler(async (req, res) => {
    const { course: courseId, module, title, description, dueDate, maxPoints, questions } = req.body;
    const quiz = await Quiz.create({
        course: courseId,
        module: module || null,
        title,
        description,
        dueDate,
        maxPoints,
        questions,
        createdBy: req.user._id,
    });

    res.status(201).json(quiz);
});

export const getQuizzes = asyncHandler(async (req, res) => {
    const filter = req.query.course ? { course: req.query.course } : {};
    const quizzes = await Quiz.find(filter)
        .populate('module', 'title')
        .populate('course', 'courseCode title');

    res.json(quizzes);
});

export const getQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id)
        .populate('module', 'title')
        .populate('course', 'courseCode title');
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    res.json(quiz);
});

export const updateQuiz = asyncHandler(async (req, res) => {
    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    res.json(updated);
});

export const deleteQuiz = asyncHandler(async (req, res) => {
    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) {
        res.status(404);
        throw new Error('Quiz not found');
    }

    res.json({ message: 'Quiz deleted' });
});
