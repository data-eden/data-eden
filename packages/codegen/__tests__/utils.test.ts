import { describe, expect, test } from 'vitest';

import { graphqlFilesMap } from './utils/project';
import { rewriteAst } from '../src/utils';
import { buildASTSchema, parse, print } from 'graphql';

describe('utils', () => {
  describe('rewriteAst', () => {
    test('replace field value with primary key', async () => {
      expect(
        print(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          rewriteAst(
            parse(`
              fragment car on Car {
                  make
                  model
                  owner
              }
            `),
            buildASTSchema(parse(graphqlFilesMap['schema.graphql'])),
            {
              primaryKey: 'entityUrn',
              fields: {
                Car: 'id',
              },
            }
          )
        )
      ).toMatchInlineSnapshot(`
        "fragment car on Car {
          __typename
          make
          model
          owner
          entityUrn: id
        }"
      `);
    });

    test('replace fields within fragment, inline fragment and query value with primary key', async () => {
      expect(
        print(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          rewriteAst(
            parse(`
              fragment car on Car {
                  id
                  make
                  model
                  owner
              }

              query {
                  carsForDays(id: 1234) {
                      ...car
                      ... on Car {
                          make
                      }
                  }
              }
          `),
            buildASTSchema(parse(graphqlFilesMap['schema.graphql'])),
            {
              primaryKey: 'entityUrn',
              fields: {
                Car: 'id',
              },
            }
          )
        )
      ).toMatchInlineSnapshot(`
        "fragment car on Car {
          __typename
          id
          make
          model
          owner
          entityUrn: id
        }

        {
          __typename
          carsForDays(id: 1234) {
            __typename
            ...car
            ... on Car {
              __typename
              make
              entityUrn: id
            }
            entityUrn: id
          }
        }"
      `);
    });
  });
});
