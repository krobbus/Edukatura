import { Navigate, Route, Routes } from 'react-router';
import './styles/base.css';
import './styles/layout.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/course.css';
import './styles/assignment.css';
import './styles/grading.css';
import './styles/users.css';
import './styles/notFound.css';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import AssignmentDetail from './pages/AssignmentDetail';
import Grading from './pages/Grading';
import Users from './pages/Users';
import NotFound from './pages/NotFound';

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
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/assignments/:assignmentId" element={<AssignmentDetail />} />

                    <Route element={<ProtectedRoute allow={['faculty', 'admin']} />}>
                        <Route path="/assignments/:assignmentId/submissions" element={<Grading />} />
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