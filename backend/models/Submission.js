import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
    {
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment',
            required: function () { return !this.quiz; },
        },
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: function () { return !this.assignment; },
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        submissionText: String,
        fileUrl: String,
        answers: { 
            type: [mongoose.Schema.Types.Mixed], 
            default: undefined
        },
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

submissionSchema.index(
    { assignment: 1, student: 1 },
    { unique: true, partialFilterExpression: { assignment: { $type: 'objectId' } } }
);

submissionSchema.index(
    { quiz: 1, student: 1 },
    { unique: true, partialFilterExpression: { quiz: { $type: 'objectId' } } }
);

export default mongoose.model('Submission', submissionSchema);