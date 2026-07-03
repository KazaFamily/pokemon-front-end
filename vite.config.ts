import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project sites are served from /<repo-name>/, so builds need
  // that as the base path. Local dev keeps the default root path.
  base: process.env.NODE_ENV === 'production' ? '/pokemon-front-end/' : '/',
})
