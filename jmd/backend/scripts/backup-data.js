/**
 * Daily Data Backup Script for Jai Mata Di Auto Backend
 * Copies backend/data to backend/backups/data-YYYY-MM-DD-HHmmss
 * Retains only the last 14 backups (auto-prunes older ones)
 */

const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BACKEND_ROOT, 'data');
const BACKUPS_DIR = path.join(BACKEND_ROOT, 'backups');
const MAX_BACKUPS = 14;

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function runBackup() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('Data directory does not exist:', DATA_DIR);
    process.exit(1);
  }

  fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const backupFolder = path.join(BACKUPS_DIR, `data-${timestamp}`);

  console.log(`Starting backup of ${DATA_DIR} to ${backupFolder}...`);
  copyDirRecursive(DATA_DIR, backupFolder);
  console.log(`✅ Backup successfully created at ${backupFolder}`);

  // Prune older backups
  const allBackups = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('data-') && fs.statSync(path.join(BACKUPS_DIR, f)).isDirectory())
    .sort();

  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
    console.log(`Pruning ${toDelete.length} old backup(s) to retain last ${MAX_BACKUPS}...`);
    for (const old of toDelete) {
      const p = path.join(BACKUPS_DIR, old);
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`Removed old backup: ${old}`);
    }
  }

  console.log(`Total current backups: ${Math.min(allBackups.length, MAX_BACKUPS)}`);
}

if (require.main === module) {
  runBackup();
}

module.exports = { runBackup };
