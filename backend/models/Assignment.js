import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
    {
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
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
        },
        description: {
            type: String,
            required: true,
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