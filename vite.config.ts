import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension';

  if (isExtension) {
    return {
      plugins: [react()],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            popup: resolve(__dirname, 'popup.html'),
            templates: resolve(__dirname, 'templates.html'),
            background: resolve(__dirname, 'src/extension/background.ts'),
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'chunks/[name].js',
            assetFileNames: 'assets/[name].[ext]',
          },
        },
      },
    };
  }

  // 默认 Web Playground 开发服务器模式
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5174,
      open: true,
    },
    build: {
      outDir: 'dist',
    },
  };
});
