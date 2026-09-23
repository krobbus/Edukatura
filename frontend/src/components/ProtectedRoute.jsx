import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ allow }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <Loading label="Checking your session" />;

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    if (allow && !allow.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}