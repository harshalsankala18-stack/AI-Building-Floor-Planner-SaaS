/**
 * Backend server bundler.
 *
 * Builds a single-file CJS bundle of the backend HTTP boundary (Phase 2 §36)
 * using esbuild's JS API from the hoisted store.
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'packages', 'backend');
const esbuildPkgDir = path.join(root, 'node_modules', '.pnpm', 'esbuild@0.21.5', 'node_modules', 'esbuild');
const require = createRequire(path.join(esbuildPkgDir, 'package.json'));
const esbuild = require('./lib/main.js');

mkdirSync(path.join(backend, 'dist-server'), { recursive: true });

await esbuild.build({
  entryPoints: [path.join(backend, 'src', 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: path.join(backend, 'dist-server', 'server.cjs'),
  external: ['@resvg/resvg-js', 'pdfkit'],
  logLevel: 'warning',
});

console.log('Backend bundle written to packages/backend/dist-server/server.cjs');

if (process.argv.includes('--run')) {
  const { fork } = await import('node:child_process');
  fork(path.join(backend, 'dist-server', 'server.cjs'), { stdio: 'inherit' });
}
