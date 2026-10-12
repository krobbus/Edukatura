import asyncHandler from '../utils/asyncHandler.js';
import { Course, Enrollment } from '../models/index.js';
import User from '../models/User.js';

export const createCourse = asyncHandler(async (req, res) => {
    const { courseCode, title, description, instructor } = req.body;
    let instructorId = req.user._id;

    if (req.user.role === 'admin') {
        if (!instructor) {
            res.status(400);
            throw new Error('A instructor member is required');
        }

        const selectedInstructor = await User.findOne({ _id: instructor, role: 'instructor' });
        if (!selectedInstructor) {
            res.status(400);
            throw new Error('Selected instructor member was not found');
        }

        instructorId = selectedInstructor._id;
    }

    const newCourse = await Course.create({
        courseCode,
        title,
        description,
        instructor: instructorId
    });

    await newCourse.populate('instructor', 'firstName middleName lastName email');

    res.status(201).json(newCourse);
});

export const getCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find().populate('instructor', 'firstName lastName email');

    if (req.user.role ===  'learner') {
        const enrollments = await Enrollment.find({ learner: req.user._id }).select('course').lean();
        const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.course.toString()));

        return res.json(courses.map((course) => ({
            ...course.toObject(),
            isEnrolled: enrolledCourseIds.has(course._id.toString()),
        })));
    }

    res.json(courses);
});

export const getCourseById = asyncHandler(async (req, res) => {
    const foundCourse = await Course.findById(req.params.id).populate('instructor', 'firstName lastName email');

    if (!foundCourse) {
        res.status(404);
        throw new Error('Course not found');
    }

    res.json(foundCourse);
});

export const updateCourse = asyncHandler(async (req, res) => {
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!updated) {
        res.status(404);
        throw new Error('Course not found');
    }

    res.json(updated);
});

export const deleteCourse = asyncHandler(async (req, res) => {
    const deleted = await Course.findByIdAndDelete(req.params.id);

    if (!deleted) {
        res.status(404);
        throw new Error('Course not found');
    }

    res.json({ message: 'Course deleted' });
});