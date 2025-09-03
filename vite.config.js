// vite.config.js
import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    reactRouter(), // React Router v7 plugin for Remix-like routing
    tsconfigPaths(), // Resolves tsconfig path aliases
    tailwindcss(), // Tailwind CSS integration
  ],
});