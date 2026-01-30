import { lazy } from "react";
import NotFound from "../screens/error/NotFound";

const ErrorUI = lazy(() => import("../screens/error/ErrorUI"));

export const fallbackRoutes = [
  {
    path: "*",
    element: <NotFound />,
  },
];
