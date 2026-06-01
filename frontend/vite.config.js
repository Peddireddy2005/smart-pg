import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "https://smart-pg-backend-9l7f.onrender.com/", changeOrigin: true },
    },
  },
});