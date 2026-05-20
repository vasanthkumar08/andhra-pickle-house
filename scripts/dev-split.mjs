import { spawn } from 'node:child_process';

const commands = [
  { title: 'APH API', command: 'npm run dev:backend' },
  { title: 'APH WEB', command: 'npm run dev:frontend' },
];

if (process.platform !== 'win32') {
  console.log('Open two terminals and run: npm run dev:backend | npm run dev:frontend');
  process.exit(0);
}

for (const item of commands) {
  spawn(
    'powershell.exe',
    [
      '-NoExit',
      '-Command',
      `$host.UI.RawUI.WindowTitle='${item.title}'; Set-Location '${process.cwd()}'; ${item.command}`,
    ],
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    }
  ).unref();
}

console.log('[DEV] Started dedicated API and WEB terminals.');

