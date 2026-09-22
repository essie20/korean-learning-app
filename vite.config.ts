import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Local dev/preview stay at "/". Only the GitHub Pages production build
  // (npm run build:pages, mode "gh-pages") uses the repository sub-path.
  base: mode === 'gh-pages' ? '/korean-learning-app/' : '/',
  plugins: [react(), tailwindcss()],
}))
