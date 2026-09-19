import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
});
enrollmentSchema.index({ class: 1, student: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);