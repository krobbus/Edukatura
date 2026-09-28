import { Navigate, Route, Routes } from 'react-router';

import './styles/base.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/courses.css';
import './styles/grading.css';
import './styles/users.css';

// components
import './styles/components/loading.css';
import './styles/components/layout.css';
import './styles/components/notFound.css';
import './styles/components/emptyState.css';
import './styles/components/errorNote.css';

// views
import './styles/views/courseDetail.css';
import './styles/views/assignmentDetail.css';
import './styles/views/quizDetail.css';

// forms
import './styles/forms/courseForm.css';
import './styles/forms/moduleForm.css';
import './styles/forms/assignmentForm.css';
import './styles/forms/quizForm.css';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Grading from './pages/Grading';
import Users from './pages/Users';
import NotFound from './pages/NotFound';

// views
import CourseDetail from './pages/views/CourseDetail';
import AssignmentDetail from './pages/views/AssignmentDetail';
import QuizDetail from './pages/views/QuizDetail';

// forms
import CourseForm from './pages/forms/CourseForm';
import ModuleForm from './pages/forms/ModuleForm';
import AssignmentForm from './pages/forms/AssignmentForm';
import QuizForm from './pages/forms/QuizForm';

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />}/>
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/new" element={<CourseForm />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/courses/:courseId/edit" element={<CourseForm />} />

                    <Route path="/courses/:courseId/modules/new" element={<ModuleForm />} />
                    <Route path="/courses/:courseId/modules/:moduleId/edit" element={<ModuleForm />} />

                    <Route path="/courses/:courseId/assignments/:assignmentId" element={<AssignmentDetail />} />
                    <Route path="/courses/:courseId/assignments/new" element={<AssignmentForm />} />
                    <Route path="/courses/:courseId/assignments/:assignmentId/edit" element={<AssignmentForm />} />

                    <Route path="/courses/:courseId/quizzes/:quizId" element={<QuizDetail />} />
                    <Route path="/courses/:courseId/quizzes/new" element={<QuizForm />} />
                    <Route path="/courses/:courseId/quizzes/:quizId/edit" element={<QuizForm />} />

                    <Route element={<ProtectedRoute allow={['faculty', 'admin']} />}>
                        <Route path="/courses/:courseId/assignments/:assignmentId/submissions" element={<Grading />} />
                        <Route path="/courses/:courseId/quizzes/:quizId/submissions" element={<Grading />} />
                    </Route>

                    <Route element={<ProtectedRoute allow={['admin']} />}>
                        <Route path="/users" element={<Users />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Route>
            </Route>
        </Routes>
    );
}