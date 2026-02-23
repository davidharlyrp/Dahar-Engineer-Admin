import { Navigate, Outlet } from "react-router-dom";
import { pb } from "../../lib/pb";

export function ProtectedRoute() {
    const isAuthenticated = pb.authStore.isValid;
    const isAdmin = pb.authStore.model?.isAdmin === true;

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
