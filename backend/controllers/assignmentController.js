import asyncHandler from '../utils/asyncHandler.js';
import { Assignment } from '../models/index.js';

export const createAssignment = asyncHandler(async (req, res) => {
    const { course: courseId, module, title, description, dueDate, maxPoints } = req.body;
    const assignment = await Assignment.create({
        course: courseId,
        module: module || null,
        title,
        description,
        dueDate,
        maxPoints,
        createdBy: req.user._id
    });

    res.status(201).json(assignment);
});

export const getAssignments = asyncHandler(async (req, res) => {
    const filter = req.query.course ? { course: req.query.course } : {};
    const assignments = await Assignment.find(filter).populate('module', 'title');

    res.json(assignments);
});

export const getAssignmentById = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id).populate('module', 'title');
    if (!assignment) {
        res.status(404);
        throw new Error('Assignment not found');
    }

    res.json(assignment);
});

export const updateAssignment = asyncHandler(async (req, res) => {
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
    if (!updated) {
        res.status(404);
        throw new Error('Assignment not found');
    }

    res.json(updated);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) {
        res.status(404);
        throw new Error('Assignment not found');
    }
    
    res.json({ message: 'Assignment deleted' });
});
