export { createServer } from './server.js';

import { fileURLToPath } from 'url';
import * as path from 'path';

export function sanitizeStacktrace(errorStack: string): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const prefix = path.resolve(__dirname, '../../../');
  const lines = errorStack.split('\n');

  return (
    lines
      // only look at the first 3 stack frames to avoid including a bunch of node_modules and whatnot
      .slice(0, 3)
      // strip the repo root prefix from the stacks to ensure stable across users
      .map((line: string) => line.replace(prefix, ''))
      // strip line:col information
      .map((line: string) => line.replace(/:\d+:\d+/, ''))
      // remove trailing whitespace (avoids snapshot instability for editors that auto delete trailing whitespace)
      .map((line: string) => line.trimEnd())
      .join('\n')
  );
}
