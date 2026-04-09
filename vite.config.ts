import { defineConfig } from 'vite';
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react-swc';

const __dirname = path.dirname(path.resolve(new URL(import.meta.url).pathname));

/** Backend API target for dev proxy (avoids CORS when backend blocks localhost) */
const DEV_API_TARGET = (process.env.VITE_APP_API_URL || "https://apis-dev.9jasettlement.com").replace(/\/+$/, "");
/**
 * Path segment to replace /api-dev with when proxying. Use "" so paths are forwarded as-is:
 * /api-dev/account/login/ -> /account/login/, /api-dev/api/as/v1/... -> /api/as/v1/...
 * Set VITE_DEV_PROXY_PATH_PREFIX=/api in .env only if the backend expects an extra /api prefix.
 */
const DEV_PROXY_PATH_PREFIX = process.env.VITE_DEV_PROXY_PATH_PREFIX ?? "";

export default defineConfig({
  // Amplify/Vercel root: use "/" or leave VITE_BASE_PATH unset. For subpath (e.g. GitHub Pages) set VITE_BASE_PATH=/settlement-beta-ui/
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    proxy: {
      "/api-dev": {
        target: DEV_API_TARGET,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api-dev/, DEV_PROXY_PATH_PREFIX || ""),
      },
    },
  },
  preview: {
    allowedHosts: [
      "www.app.staging.9jasettlement.com",
      "app.staging.9jasettlement.com",
    ],
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // @ maps to src
    },
  },
});
