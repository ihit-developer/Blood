import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Express backend (server.js) runs on this port during development.
const backend = "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  // The production build is written straight into ../public,
  // which server.js already serves with express.static("public").
  build: {
    outDir: "../public",
    emptyOutDir: true,
    // Keep the same file names the Express app already serves: /assets/app.js and /assets/app.css
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (info) => (info.name && info.name.endsWith(".css") ? "assets/app.css" : "assets/[name][extname]"),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/donors": backend,
      "/donor/": backend,
      "/requests": backend,
      "/notifications": backend,
      "/admin/": backend,
      "/whatsapp": backend,
    },
  },
});
