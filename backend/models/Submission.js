import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
    {
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment',
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        submissionText: String,
        fileUrl: String,
        grade: {
            type: Number,
            min: 0,
            default: null,
        },
        feedback: String,
        status: {
            type: String,
            enum: ['pending', 'submitted', 'graded'],
            default: 'pending',
            required: true,
        },
        submittedAt: Date,
        gradedAt: Date,
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { 
        timestamps: { 
            createdAt: 'createdAt', 
            updatedAt: false 
        } 
    }
);
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);