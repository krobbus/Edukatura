import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
    {
        classCode: {
            type: String,
            required: true,
            unique: true,
            maxlength: 10,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            maxlength: 100,
        },
        description: String,
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

export default mongoose.model('Class', classSchema);