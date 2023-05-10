import * as crypto from 'node:crypto';
import type { DocumentNode } from 'graphql';
import { printExecutableGraphQLDocument } from '@graphql-tools/documents';

export function defaultHash(document: DocumentNode): string {
  return crypto
    .createHash('sha256')
    .update(printExecutableGraphQLDocument(document))
    .digest('hex');
}
