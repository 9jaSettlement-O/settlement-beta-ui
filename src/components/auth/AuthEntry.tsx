import { Navigate } from "react-router-dom";
import { getDeviceHint } from "@/utils/device-hint.util";

/**
 * Entry route for unauthenticated users.
 * Redirects to /login if device hint is "returning", else to /select-account-type.
 */
const AuthEntry = () => {
  const hint = getDeviceHint();
  return <Navigate to={hint === "returning" ? "/login" : "/select-account-type"} replace />;
};

export default AuthEntry;
