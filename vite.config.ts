import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works at any path (e.g. https://<user>.github.io/GymGuru/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
