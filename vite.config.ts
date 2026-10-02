import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Sitemap from 'vite-plugin-sitemap'

const routes = [
  '/ai-excel',
  '/merge-pdf',
  '/split-pdf',
  '/compress-pdf',
  '/pdf-to-word',
  '/pdf-to-excel',
  '/pdf-to-powerpoint',
  '/pdf-to-jpg',
  '/jpg-to-pdf',
  '/word-to-pdf',
  '/excel-to-pdf',
  '/powerpoint-to-pdf',
  '/pdf-editor',
  '/rotate-pdf',
  '/organize-pdf',
  '/watermark-pdf',
  '/protect-pdf',
  '/unlock-pdf',
  '/pdf-sign',
  '/extract-pages',
  '/ocr-pdf',
  '/crop-pdf',
  '/metadata-editor',
  '/privacy-policy',
  '/terms-of-service',
  '/contact',
]

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    Sitemap({
      hostname: 'https://pdfplayofficial.com',
      dynamicRoutes: routes,
      generateRobotsTxt: true,
    }),
  ],
})