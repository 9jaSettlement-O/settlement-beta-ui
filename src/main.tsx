import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.tsx";
import { QueryProvider } from "@/services/shared/cache-query.tsx";

import { Toaster } from "@/components/ui/toaster";

Sentry.init({
  dsn: "https://32f8c1610cd6893e3bd04ead00efadcd@o4511174407553024.ingest.us.sentry.io/4511179260428288",
  sendDefaultPii: true,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
      <Toaster />
    </QueryProvider>
  </StrictMode>
);
