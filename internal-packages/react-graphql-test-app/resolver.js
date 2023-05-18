import { readFileSync } from 'node:fs';
import { createMatchPath } from 'tsconfig-paths';

const tsConfig = JSON.parse(readFileSync('./tsconfig.json'));
const matcher = createMatchPath(process.cwd(), tsConfig.compilerOptions.paths);

export default function resolver(path, options) {
  const extensions = ['.tsx', '.jsx', '.js', '.ts'];

  return matcher(path, undefined, undefined, extensions);
}
