import { defineConfig } from 'vite';
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react-swc';

const __dirname = path.dirname(path.resolve(new URL(import.meta.url).pathname));

export default defineConfig({
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
