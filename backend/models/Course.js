import mongoose from 'mongoose';
import { capitalizeFirstLetter } from '../utils/text.js';

const courseSchema = new mongoose.Schema(
    {
        courseCode: {
            type: String,
            required: true,
            unique: true,
            maxlength: 10,
            trim: true,
            set: (value) => value?.toUpperCase(),
        },
        title: {
            type: String,
            required: true,
            maxlength: 100,
            set: capitalizeFirstLetter,
        },
        description: {
            type: String,
            set: capitalizeFirstLetter,
        },
        faculty: {
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

export default mongoose.model('Course', courseSchema);