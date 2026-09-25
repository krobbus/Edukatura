import mongoose from 'mongoose';
import { capitalizeFirstLetter } from '../utils/text.js';

const questionSchema = new mongoose.Schema(
    {
        prompt: {
            type: String,
            required: true,
            maxlength: 500,
            set: capitalizeFirstLetter,
        },
        choices: {
            type: [
                {
                    type: String,
                    required: true,
                    maxlength: 250,
                    set: capitalizeFirstLetter,
                },
            ],
            required: true,
            validate: {
                validator: (choices) => choices.length >= 2 && choices.length <= 4,
                message: 'Each question must have between 2 and 4 choices',
            },
        },
        correctAnswer: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function (answer) {
                    return answer < this.choices.length;
                },
                message: 'The correct answer must match one of the choices',
            },
        },
    },
    { _id: false }
);

const quizSchema = new mongoose.Schema(
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
        questions: {
            type: [questionSchema],
            required: true,
            validate: {
                validator: (questions) => questions.length > 0,
                message: 'A quiz must have at least one question',
            },
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
            updatedAt: false,
        },
    }
);

export default mongoose.model('Quiz', quizSchema);
