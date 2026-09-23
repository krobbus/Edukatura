import mongoose from 'mongoose';
import { capitalizeWords } from '../utils/text.js';

const userSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['student', 'faculty', 'admin'],
            default: 'student',
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
            maxlength: 50,
            trim: true,
            set: capitalizeWords,
        },
        middleName: {
            type: String,
            maxlength: 50,
            trim: true,
            set: capitalizeWords,
        },
        lastName: {
            type: String,
            required: true,
            maxlength: 50,
            trim: true,
            set: capitalizeWords,
        }
    },
    {
        timestamps: { 
            createdAt: 'createdAt', 
            updatedAt: false 
        }
    }
);

export default mongoose.model('User', userSchema);