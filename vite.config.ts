import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_GROQ_API_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || ''
      ),
      'process.env.NEXT_PUBLIC_GEMINI_API_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
      ),
      'process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || ''
      ),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
