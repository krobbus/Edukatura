import asyncHandler from '../utils/asyncHandler.js';
import { Class } from '../models/index.js';

export const createClass = asyncHandler(async (req, res) => {
    const { classCode, title, description } = req.body;
    const newClass = await Class.create({
        classCode,
        title,
        description,
        faculty: req.user._id
    });
    
    res.status(201).json(newClass);
});

export const getClasses = asyncHandler(async (req, res) => {
    const classes = await Class.find().populate('faculty', 'firstName lastName email');

    res.json(classes);
});

export const getClassById = asyncHandler(async (req, res) => {
    const foundClass = await Class.findById(req.params.id).populate('faculty', 'firstName lastName email');
    
    if (!foundClass) {
        res.status(404);
        throw new Error('Class not found');
    }

    res.json(foundClass);
});

export const updateClass = asyncHandler(async (req, res) => {
    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!updated) {
        res.status(404);
        throw new Error('Class not found');
    }

    res.json(updated);
});

export const deleteClass = asyncHandler(async (req, res) => {
    const deleted = await Class.findByIdAndDelete(req.params.id);

    if (!deleted) {
        res.status(404);
        throw new Error('Class not found');
    } 

    res.json({ message: 'Class deleted' });
});