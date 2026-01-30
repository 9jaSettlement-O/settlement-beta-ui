import { Navigate } from "react-router-dom";
import storage from "@/utils/storage.util";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const isAuthenticated = storage.checkToken();

  if (!isAuthenticated) {
    return <Navigate to="/select-account-type" replace />;
  }

  if (roles && roles.length > 0) {
    const userType = storage.getUserType();
    if (!userType || !roles.includes(userType)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
