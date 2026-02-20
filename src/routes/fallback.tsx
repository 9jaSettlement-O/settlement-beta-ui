import NotFound from "../screens/error/NotFound";

export const fallbackRoutes = [
  {
    path: "*",
    element: <NotFound />,
  },
];
