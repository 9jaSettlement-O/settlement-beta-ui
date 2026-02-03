import { useRoutes, useLocation } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { publicRoutes } from "./public";
import { privateRoutes } from "./private";
import { fallbackRoutes } from "./fallback";
import ProtectedRoute from "./ProtectedRoute";
import type { IFallbackandError, RouteType } from "@/types/common.types";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorUI from "@/screens/error/ErrorUI";

function withFallbackAndErrorBoundary(data: IFallbackandError) {
  const {
    element,
    fallbackUI = <Skeleton className="h-40 w-full rounded-md" />,
  } = data;

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorUI error={error} onRetry={resetErrorBoundary} />
      )}
      onError={(error) => {
        console.error("[ErrorBoundary] Caught error:", error);
      }}
    >
      <Suspense fallback={fallbackUI}>{element}</Suspense>
    </ErrorBoundary>
  );
}

const parseRoutes = (routes: RouteType[], isPrivate = false): RouteObject[] => {
  return routes.map(({ path, element, roles, children }) => {
    let wrappedElement = element;

    if (isPrivate && roles) {
      wrappedElement = (
        <ProtectedRoute roles={roles}>
          {element}
        </ProtectedRoute>
      );
    }

    return {
      path,
      element: withFallbackAndErrorBoundary({
        element: wrappedElement,
      }),
      children: children ? parseRoutes(children, isPrivate) : undefined,
    };
  });
};

const AppRoutes = () => {
  const location = useLocation();
  const allRoutes: RouteObject[] = [
    ...parseRoutes(publicRoutes),
    ...parseRoutes(privateRoutes, true),
    ...parseRoutes(fallbackRoutes),
  ];

  const routing = useRoutes(allRoutes);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {routing && <div key={location.pathname}>{routing}</div>}
    </AnimatePresence>
  );
};

export default AppRoutes;
