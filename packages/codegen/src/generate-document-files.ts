import type { Types } from '@graphql-codegen/plugin-helpers';
import { parse } from 'graphql';
import { readFile } from 'node:fs/promises';

export async function generateDocumentFiles(
  documentPaths: Array<string>
): Promise<Array<Types.DocumentFile>> {
  const documents: Array<Types.DocumentFile> = await Promise.all(
    documentPaths.map(async (path) => {
      const contents = await readFile(path, 'utf-8');
      const parsed = parse(contents);
      return {
        location: path,
        document: parsed,
        rawSDL: contents,
      };
    })
  );

  return documents;
}
