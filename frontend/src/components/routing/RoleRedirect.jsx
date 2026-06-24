
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleRedirect() 
{
    const { user } = useAuth();
    if (user?.role === "therapist") {
        return <Navigate to="/therapist/dashboard" replace />;
    }
    return <Navigate to="/client/dashboard" replace />;
}