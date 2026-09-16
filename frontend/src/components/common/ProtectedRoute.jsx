import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getCurrentUserId } from "../../services/currentUserService";


function ProtectedRoute() {

    const location = useLocation();
    const userId = getCurrentUserId();

    if (!userId) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return <Outlet />;
}


export default ProtectedRoute;
