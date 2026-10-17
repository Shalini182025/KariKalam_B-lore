import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('auth_role');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(userRole as string)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
