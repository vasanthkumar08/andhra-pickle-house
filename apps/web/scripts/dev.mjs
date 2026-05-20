import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = colors.cyan) {
  console.log(`${colors.dim}${new Date().toISOString()}${colors.reset} ${color}[WEB]${colors.reset} ${message}`);
}

const requestedPort = process.env.WEB_PORT || '3000';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
const require = createRequire(import.meta.url);

function checkPort(targetPort, host) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${targetPort} is already in use.`));
        return;
      }
      reject(error);
    });
    server.once('listening', () => {
      server.close(resolve);
    });
    server.listen(Number(targetPort), host);
  });
}

async function assertPortAvailable(targetPort) {
  await checkPort(targetPort, '0.0.0.0');
  await checkPort(targetPort, '::');
}

async function resolvePort() {
  const explicitPort = Boolean(process.env.WEB_PORT);
  const candidates = explicitPort ? [requestedPort] : ['3000', '3001', '3002'];

  for (const candidate of candidates) {
    try {
      await assertPortAvailable(candidate);
      if (candidate !== requestedPort) {
        log(`Port ${requestedPort} busy; using ${candidate}`, colors.yellow);
      }
      return candidate;
    } catch (error) {
      if (explicitPort) throw error;
    }
  }

  throw new Error('Ports 3000, 3001, and 3002 are busy. Stop an existing frontend or set WEB_PORT.');
}

log(`Environment Loaded (${process.env.NODE_ENV || 'development'})`);
log(`API target ${apiUrl}`);

let port;
try {
  port = await resolvePort();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Port availability check failed';
  log(`${message} Stop the existing process or set WEB_PORT.`, colors.red);
  process.exit(1);
}

const nextCli = require.resolve('next/dist/bin/next');
const distDir = process.env.NEXT_DIST_DIR || `.next-dev-${port}`;
const child = spawn(process.execPath, [nextCli, 'dev', '--port', port], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_DIST_DIR: distDir,
  },
});

log(`Frontend Running on port ${port}`, colors.green);
log(`Next cache directory ${distDir}`);

child.on('exit', (code) => {
  if (code === 0) {
    log('Shutdown Complete', colors.green);
    return;
  }
  log(`Frontend exited with code ${code}`, colors.red);
  process.exit(code ?? 1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    log(`Graceful shutdown requested (${signal})`);
    child.kill(signal);
  });
}
