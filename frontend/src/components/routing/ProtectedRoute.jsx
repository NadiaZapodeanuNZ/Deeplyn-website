import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" />;

    return children;
}

function TherapistRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'therapist' && user.therapist_status !== 'approved') {
        return <Navigate to="/application-status" />;
    }
    return children;
}

export function ClientRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "client") return <Navigate to="/dashboard" replace />;

    return children;
}
export { ProtectedRoute, TherapistRoute };