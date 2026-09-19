import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!['student', 'faculty', 'admin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role');
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json(user);
});