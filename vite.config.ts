import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ Corrige l’erreur Vercel / Rollup
  optimizeDeps: {
    include: ["framer-motion"],
  },

  // ✅ Empêche Rollup de bloquer le build
  build: {
    rollupOptions: {
      external: ["framer-motion"],
    },
  },
}));
