import asyncHandler from '../utils/asyncHandler.js';
import { Module } from '../models/index.js';

export const createModule = asyncHandler(async (req, res) => {
    const { class: classId, title, description } = req.body;
    const newModule = await Module.create({
        class: classId,
        title,
        description,
        createdBy: req.user._id
    });

    res.status(201).json(newModule);
});

export const getModules = asyncHandler(async (req, res) => {
    const filter = req.query.class ? { class: req.query.class } : {};
    const modules = await Module.find(filter).populate('createdBy', 'firstName lastName');

    res.json(modules);
});

export const getModuleById = asyncHandler(async (req, res) => {
    const foundModule = await Module.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!foundModule) {
        res.status(404);
        throw new Error('Module not found');
    }

    res.json(foundModule);
});

export const updateModule = asyncHandler(async (req, res) => {
    const updated = await Module.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
    if (!updated) {
        res.status(404);
        throw new Error('Module not found');
    }

    res.json(updated);
});

export const deleteModule = asyncHandler(async (req, res) => {
    const deleted = await Module.findByIdAndDelete(req.params.id);
    if (!deleted) {
        res.status(404);
        throw new Error('Module not found');
    }

    res.json({ message: 'Module deleted' });
});