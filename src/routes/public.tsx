import { lazy } from "react";
import { Navigate } from "react-router-dom";

const SelectAccountType = lazy(() => import("../screens/onboarding/SelectAccountType"));
const OnboardingFlow = lazy(() => import("../screens/onboarding/OnboardingFlow"));
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
    path: "/onboarding",
    element: <OnboardingFlow />,
  },
  {
    path: "/create-account",
    element: <Navigate to="/onboarding" replace />,
  },
  {
    path: "/verify-email",
    element: <Navigate to="/onboarding" replace />,
  },
  {
    path: "/onboarding-success",
    element: <Navigate to="/onboarding" replace />,
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
