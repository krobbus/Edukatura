import mongoose from 'mongoose';
import { capitalizeFirstLetter } from '../utils/text.js';

const assignmentSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module',
            default: null,
        },
        title: {
            type: String,
            required: true,
            maxlength: 100,
            set: capitalizeFirstLetter,
        },
        description: {
            type: String,
            required: true,
            set: capitalizeFirstLetter,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        maxPoints: {
            type: Number,
            default: 100,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { 
        timestamps: { 
            createdAt: 'createdAt', 
            updatedAt: false 
        } 
    }
);

export default mongoose.model('Assignment', assignmentSchema);