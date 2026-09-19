import bcrypt from 'bcryptjs';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import { User } from '../models/index.js';

export const register = asyncHandler(async (req, res) => {
    const { role, email, password, firstName, middleName, lastName } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
        res.status(400);
        throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ role, email, passwordHash, firstName, middleName, lastName });

    res.status(201).json({
        _id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        token: generateToken(user._id),
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    res.json({
        _id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        token: generateToken(user._id),
    });
});

export const getMe = asyncHandler(async (req, res) => {
    res.json(req.user);
});