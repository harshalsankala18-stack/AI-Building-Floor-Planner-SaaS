import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emptyStub = path.resolve(__dirname, 'src/stubs/empty.js');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      'clipper2-wasm': emptyStub,
      '@chanmeng666/archlang': emptyStub,
      '@resvg/resvg-js': emptyStub,
      'pdfkit': emptyStub,
    },
  },
});
