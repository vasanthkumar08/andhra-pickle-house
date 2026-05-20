import { spawnSync } from 'node:child_process';

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.cyan) {
  console.log(`${colors.dim}${new Date().toISOString()}${colors.reset} ${color}[INFRA]${colors.reset} ${message}`);
}

function run(command, args) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

const dockerCheck = spawnSync('docker', ['--version'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (dockerCheck.error || dockerCheck.status !== 0) {
  log('Docker CLI not found.', colors.red);
  log('Install and start Docker Desktop, then reopen this terminal and run: npm run infra:up', colors.red);
  log('Alternative: set DATABASE_URL to a Supabase/PostgreSQL connection string in .env.', colors.red);
  process.exit(1);
}

log('Docker detected');
log('Starting PostgreSQL and Redis');

const result = run('docker', ['compose', 'up', '-d', 'postgres', 'redis']);
if (result.status !== 0) {
  log('Docker Compose failed. Make sure Docker Desktop is running.', colors.red);
  process.exit(result.status ?? 1);
}

log('PostgreSQL and Redis startup requested', colors.green);
run('docker', ['compose', 'ps']);

