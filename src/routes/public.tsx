import { lazy } from "react";
import { Navigate } from "react-router-dom";

const SelectAccountType = lazy(() => import("../screens/onboarding/SelectAccountType"));
const AccountCreationFlow = lazy(() => import("../screens/onboarding/AccountCreationFlow"));
const SetupPin = lazy(() => import("../screens/onboarding/SetupPin"));
const IndividualKyc = lazy(() => import("../screens/onboarding/kyc/IndividualKyc"));
const BusinessKyb = lazy(() => import("../screens/onboarding/kyc/BusinessKyb"));
const AgentOnboarding = lazy(() => import("../screens/onboarding/kyc/AgentOnboarding"));
const Login = lazy(() => import("../screens/auth/Login"));
const ForgotPassword = lazy(() => import("../screens/auth/ForgotPassword"));

export const publicRoutes = [
  {
    path: "/",
    element: <Navigate to="/select-account-type" replace />,
  },
  {
    path: "/select-account-type",
    element: <SelectAccountType />,
  },
  {
    path: "/create-account",
    element: <AccountCreationFlow />,
  },
  {
    path: "/verify-email",
    element: <Navigate to="/create-account" replace />,
  },
  {
    path: "/onboarding-success",
    element: <Navigate to="/create-account" replace />,
  },
  {
    path: "/setup-pin",
    element: <SetupPin />,
  },
  {
    path: "/kyc/individual",
    element: <IndividualKyc />,
  },
  {
    path: "/kyc/business",
    element: <BusinessKyb />,
  },
  {
    path: "/kyc/agent",
    element: <AgentOnboarding />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
];
