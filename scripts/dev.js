/**
 * Concurrent Development Runner
 * Spawns backend (port 3000) and frontend static dev server (port 5173)
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'jmd', 'backend');

console.log('====================================================');
console.log('  🚀 Starting Jai Mata Di Auto Development Stack   ');
console.log('====================================================');
console.log('Backend:  http://localhost:3000 (Express API)');
console.log('Frontend: http://localhost:5173 (Static Frontend & Admin)');
console.log('Press Ctrl+C to stop both servers.\n');

// 1. Spawn Backend
const backend = spawn(process.execPath, ['server.js'], {
  cwd: BACKEND_DIR,
  env: { ...process.env, PORT: '3000' },
  stdio: ['inherit', 'pipe', 'pipe']
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line) console.log(`\x1b[36m[backend]\x1b[0m ${line}`);
  }
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line) console.error(`\x1b[31m[backend-err]\x1b[0m ${line}`);
  }
});

backend.on('close', (code) => {
  console.log(`[backend] Process exited with code ${code}`);
  cleanup();
});

// 2. Spawn Frontend
const frontend = spawn(process.execPath, [path.join(ROOT, 'scripts', 'serve-frontend.js')], {
  cwd: ROOT,
  env: { ...process.env, FRONTEND_PORT: '5173' },
  stdio: ['inherit', 'pipe', 'pipe']
});

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line) console.log(`\x1b[33m[frontend]\x1b[0m ${line}`);
  }
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line) console.error(`\x1b[31m[frontend-err]\x1b[0m ${line}`);
  }
});

frontend.on('close', (code) => {
  console.log(`[frontend] Process exited with code ${code}`);
  cleanup();
});

let isShuttingDown = false;
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n[dev] Shutting down development servers...');
  try { backend.kill('SIGINT'); } catch (e) {}
  try { frontend.kill('SIGINT'); } catch (e) {}
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
