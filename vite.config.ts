import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
<<<<<<< HEAD
<<<<<<< HEAD
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 백엔드 서버 IP
=======
=======
>>>>>>> origin/develop

  // 🔥 resolve 밖에 있어야 함
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
<<<<<<< HEAD
>>>>>>> b10ebf17 (analysis-report api is connected)
=======
>>>>>>> origin/develop
        changeOrigin: true,
        secure: false,
      },
    },
  },
<<<<<<< HEAD
<<<<<<< HEAD
})
=======
});


>>>>>>> b10ebf17 (analysis-report api is connected)
=======
});


>>>>>>> origin/develop
