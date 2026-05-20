import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = ['apps/web/.next', 'apps/web/.next-dev-3000', 'apps/web/.next-dev-3001', 'apps/web/.next-dev-3002'];

for (const target of targets) {
  rmSync(resolve(target), { recursive: true, force: true });
  console.log(`[WEB] Removed ${target}`);
}

