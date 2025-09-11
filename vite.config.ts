import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Add build configuration here:
  build: {
    outDir: 'dist',         // Output directory for your built frontend
    emptyOutDir: true,      // Clean the output dir before building
    sourcemap: false,       // Disable sourcemaps for production builds (optional)
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'), // Entry point for the app
    },
  },
  base: './', // Ensure assets are loaded correctly in Electron
})

