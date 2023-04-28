import * as path from 'node:path';

export function changeExtension(fileName: string, ext: string): string {
  const parts = path.parse(fileName);

  ext = ext.startsWith('.') ? ext : `.${ext}`;

  return path.format({
    ...parts,
    ext,
    base: undefined,
  });
}
