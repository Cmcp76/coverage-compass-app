import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `vite preview` reports command "serve", same as the dev server, so it must
// be detected separately via argv or the base path silently reverts to "/"
// while dist/index.html still references the deployed subpath.
const isPreview = process.argv.includes('preview')

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' || isPreview ? '/coverage-compass-app/' : '/',
}))
