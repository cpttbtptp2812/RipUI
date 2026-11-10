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
            content: resolve(__dirname, 'src/extension/content.tsx'),
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
      port: 5173,
      open: true,
    },
    build: {
      outDir: 'dist',
    },
  };
});
