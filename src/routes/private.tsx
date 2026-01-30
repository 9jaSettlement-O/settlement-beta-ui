import { lazy } from "react";

const Dashboard = lazy(() => import("../screens/dashboard/Dashboard"));
const IndividualKyc = lazy(() => import("../screens/onboarding/kyc/IndividualKyc"));
const BusinessKyb = lazy(() => import("../screens/onboarding/kyc/BusinessKyb"));
const AgentOnboarding = lazy(() => import("../screens/onboarding/kyc/AgentOnboarding"));

export const privateRoutes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/onboarding/kyc/individual",
    element: <IndividualKyc />,
  },
  {
    path: "/onboarding/kyc/business",
    element: <BusinessKyb />,
  },
  {
    path: "/onboarding/kyc/agent",
    element: <AgentOnboarding />,
  },
];
