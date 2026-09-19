import mongoose from 'mongoose';

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
        },
        middleName: {
            type: String,
            maxlength: 50,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            maxlength: 50,
            trim: true,
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