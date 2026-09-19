import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
    {
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: true,
        },
        title: {
            type: String,
            required: true,
            maxlength: 100,
        },
        description: String,
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

export default mongoose.model('Module', moduleSchema);