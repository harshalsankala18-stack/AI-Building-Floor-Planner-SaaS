// Phase 2.7 acceptance harness launcher.
// Runs the bundled backend with the repository as cwd so `packages/backend/.env`
// is found, and keeps argv[1] ending in server.cjs so the server's own
// direct-run detection starts the listener.
const path = require('node:path');
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);
const entry = path.join(repoRoot, 'packages', 'backend', 'dist-server', 'server.cjs');
process.argv[1] = entry;
require(entry);
