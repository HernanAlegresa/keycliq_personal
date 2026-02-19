// vite.config.js
import { defineConfig } from 'vite';
import { vitePlugin as remix } from '@remix-run/dev';
import { vercelPreset } from '@vercel/remix/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    remix({ presets: [vercelPreset()] }),
    tsconfigPaths(),
  ],
});
